import axios from 'axios';

/**
 * Get YouTube channel avatar/profile picture URL
 * @param channelId YouTube channel ID (starts with UC)
 * @returns Avatar URL or null if not found
 */
export async function getYouTubeChannelAvatar(channelId: string): Promise<string | null> {
  try {
    // Validate channel ID
    if (!channelId || channelId.trim().length === 0) {
      console.warn('getYouTubeChannelAvatar: Empty or invalid channel ID provided');
      return null;
    }
    
    // Most YouTube channel IDs start with UC and are 24 characters long
    const cleanChannelId = channelId.trim();
    if (cleanChannelId.length < 10) {
      console.warn(`getYouTubeChannelAvatar: Channel ID seems too short: ${cleanChannelId}`);
      return null;
    }

    const response = await axios.get(`https://www.youtube.com/channel/${cleanChannelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Look for avatar URL in the HTML
    const avatarPatterns = [
      /"avatar":{"thumbnails":\[{"url":"([^"]+)"/,
      /"channelMetadataRenderer":{"title":"[^"]*","description":"[^"]*","rssUrl":"[^"]*","channelUrl":"[^"]*","vanityChannelUrl":"[^"]*","externalId":"[^"]*","keywords":"[^"]*","ownerUrls":\[[^\]]*\],"avatar":{"thumbnails":\[{"url":"([^"]+)"/,
      /"avatar":{"thumbnails":\[{"url":"([^"]+)","width":\d+,"height":\d+}/
    ];

    for (const pattern of avatarPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching YouTube channel avatar:', error);
    return null;
  }
}
