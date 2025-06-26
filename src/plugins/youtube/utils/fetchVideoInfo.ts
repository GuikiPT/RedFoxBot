import axios from 'axios';
import { VideoInfo, AuthorInfo } from '../../../utils/xmlTubeInfoFetcher';

export interface SingleVideoInfo {
    video: VideoInfo;
    author: AuthorInfo;
}

/**
 * Create a basic video info object with minimal data when full parsing fails
 */
function createBasicVideoInfo(videoId: string): SingleVideoInfo {
    const video: VideoInfo = {
        channel_id: 'UNKNOWN',
        video_id: videoId,
        title: `YouTube Video ${videoId}`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        description: 'Could not fetch video description.',
        thumbnails: {
            default: `https://i2.ytimg.com/vi/${videoId}/default.jpg`,
            hq_default: `https://i2.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            mq_default: `https://i2.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            sd_default: `https://i2.ytimg.com/vi/${videoId}/sddefault.jpg`,
            max_res_default: `https://i2.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        },
        community: {
            star_rating: null,
            statistics: null
        },
        published_at: Math.floor(Date.now() / 1000),
        lastUpdate_at: Math.floor(Date.now() / 1000),
    };

    const author: AuthorInfo = {
        name: 'Unknown Channel',
        url: 'https://www.youtube.com',
        id: 'UNKNOWN',
        created_at: Math.floor(Date.now() / 1000)
    };

    return { video, author };
}

/**
 * Fetch individual YouTube video information by video ID
 * @param videoId YouTube video ID
 * @returns Video and channel information or null if not found
 */
export async function fetchVideoInfo(videoId: string): Promise<SingleVideoInfo | null> {
    try {
        console.debug(`[fetchVideoInfo] Fetching info for video: ${videoId}`);
        
        // First, try to get basic video info from the watch page
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await axios.get(watchUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.status !== 200) {
            console.error(`Failed to fetch video page: ${response.status}`);
            return null;
        }

        const html = response.data;
        
        // Check if video exists (look for error indicators)
        if (html.includes('Video unavailable') || html.includes('Private video') || html.includes('This video is not available')) {
            console.error(`Video ${videoId} is not available or private`);
            return null;
        }
        
        // Extract video information from the page
        const videoInfo = extractVideoInfoFromHTML(html, videoId);
        
        if (!videoInfo) {
            console.warn(`Could not extract full video info for ${videoId}, returning basic info`);
            // Return basic info as fallback
            return createBasicVideoInfo(videoId);
        }

        console.debug(`[fetchVideoInfo] Successfully extracted info for: ${videoInfo.video.title}`);
        return videoInfo;
    } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
            console.error(`YouTube request timed out for video ${videoId}`);
        } else if (error.response && error.response.status === 404) {
            console.error(`Video not found (status 404) for video ID: ${videoId}`);
            return null;
        } else {
            console.error(`Error fetching video info for ${videoId}:`, error.message);
        }
        
        // Return basic info as fallback for network errors
        console.warn(`Returning basic video info as fallback for ${videoId}`);
        return createBasicVideoInfo(videoId);
    }
}

/**
 * Extract video information from YouTube watch page HTML
 */
function extractVideoInfoFromHTML(html: string, videoId: string): SingleVideoInfo | null {
    try {
        // Look for the initial data in the HTML
        let initialDataMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!initialDataMatch) {
            initialDataMatch = html.match(/window\["ytInitialData"\] = ({.*?});/);
        }
        
        if (!initialDataMatch) {
            console.error('Could not find ytInitialData in HTML');
            return null;
        }

        const initialData = JSON.parse(initialDataMatch[1]);
        
        // Navigate through the complex YouTube data structure
        const videoDetails = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
        const channelDetails = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer;
        
        if (!videoDetails || !channelDetails) {
            console.error('Could not find video or channel details in YouTube data');
            return null;
        }

        // Extract video information
        const title = videoDetails.title?.runs?.[0]?.text || 'Unknown Title';
        
        // Try multiple ways to get the description
        let description = '';
        if (videoDetails.expandableVideoDescriptionHeaderRenderer?.descriptionBodyText?.runs?.[0]?.text) {
            description = videoDetails.expandableVideoDescriptionHeaderRenderer.descriptionBodyText.runs[0].text;
        } else if (videoDetails.videoActions?.menuRenderer?.topLevelButtons?.[0]?.buttonRenderer?.navigationEndpoint?.watchEndpoint?.videoDescription) {
            description = videoDetails.videoActions.menuRenderer.topLevelButtons[0].buttonRenderer.navigationEndpoint.watchEndpoint.videoDescription;
        }
        
        // Try to extract description from metadata if not found in video details
        if (!description) {
            // Look for description in page metadata
            const metaDescMatch = html.match(/<meta name="description" content="([^"]*)"/);
            if (metaDescMatch) {
                description = metaDescMatch[1];
            }
        }
        
        // Extract publish date
        const publishedText = videoDetails.dateText?.simpleText || '';
        let publishedAt = Math.floor(Date.now() / 1000); // Default to now
        
        // Try to parse the publish date (this is a simplified approach)
        if (publishedText) {
            const publishDate = new Date(publishedText);
            if (!isNaN(publishDate.getTime())) {
                publishedAt = Math.floor(publishDate.getTime() / 1000);
            }
        }

        // Extract channel information
        const channelName = channelDetails.title?.runs?.[0]?.text || 'Unknown Channel';
        
        // Try multiple ways to extract channel ID
        let channelId = '';
        
        // Method 1: From navigation endpoint
        if (channelDetails.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url) {
            const urlMatch = channelDetails.navigationEndpoint.commandMetadata.webCommandMetadata.url.match(/channel\/([^\/]+)/);
            if (urlMatch) {
                channelId = urlMatch[1];
            }
        }
        
        // Method 2: From browseEndpoint
        if (!channelId && channelDetails.navigationEndpoint?.browseEndpoint?.browseId) {
            channelId = channelDetails.navigationEndpoint.browseEndpoint.browseId;
        }
        
        // Method 3: Look in the HTML for channel ID patterns
        if (!channelId) {
            const channelIdMatches = [
                html.match(/"channelId":"([^"]+)"/),
                html.match(/"externalChannelId":"([^"]+)"/),
                html.match(/channel\/([A-Za-z0-9_-]{24})/),
            ];
            
            for (const match of channelIdMatches) {
                if (match && match[1] && match[1].length >= 20) {
                    channelId = match[1];
                    break;
                }
            }
        }
        
        // Validate channel ID
        if (!channelId || channelId.length < 10) {
            console.warn(`Could not extract valid channel ID for video ${videoId}, got: ${channelId}`);
            channelId = 'UNKNOWN';
        }
        
        const channelUrl = channelId !== 'UNKNOWN' ? `https://www.youtube.com/channel/${channelId}` : 'https://www.youtube.com';

        const video: VideoInfo = {
            channel_id: channelId,
            video_id: videoId,
            title: title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            description: description,
            thumbnails: {
                default: `https://i2.ytimg.com/vi/${videoId}/default.jpg`,
                hq_default: `https://i2.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                mq_default: `https://i2.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                sd_default: `https://i2.ytimg.com/vi/${videoId}/sddefault.jpg`,
                max_res_default: `https://i2.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            },
            community: {
                star_rating: null,
                statistics: null
            },
            published_at: publishedAt,
            lastUpdate_at: Math.floor(Date.now() / 1000),
        };

        const author: AuthorInfo = {
            name: channelName,
            url: channelUrl,
            id: channelId,
            created_at: publishedAt
        };

        return { video, author };
    } catch (error) {
        console.error('Error parsing YouTube HTML:', error);
        return null;
    }
}
