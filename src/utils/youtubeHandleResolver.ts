import axios from 'axios';

export interface ChannelLookupResult {
  channelId: string | null;
  channelName?: string;
  method?: string;
  error?: string;
}

/**
 * Convert YouTube handle (@username) to channel ID using web scraping
 */
async function resolveHandleByWebScraping(handle: string): Promise<ChannelLookupResult> {
  try {
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    // Try the new handle URL format
    const response = await axios.get(`https://www.youtube.com/@${cleanHandle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Look for channel ID in various places in the HTML
    const patterns = [
      /\"externalId\":\"([^\"]+)\"/,
      /\"channelId\":\"([^\"]+)\"/,
      /channel\/([a-zA-Z0-9_-]{24})/,
      /\"webCommandMetadata\":{\"url\":\"\/channel\/([^\"]+)\"/,
      /\"browseEndpoint\":{\"browseId\":\"([^\"]+)\"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].startsWith('UC')) {
        // Extract channel name if possible
        const nameMatch = html.match(/"channelMetadataRenderer":{"title":"([^"]+)"/);
        const channelName = nameMatch ? nameMatch[1] : undefined;
        
        return {
          channelId: match[1],
          channelName,
          method: 'web-scraping'
        };
      }
    }

    return {
      channelId: null,
      error: 'Channel ID not found in page content'
    };

  } catch (error: any) {
    return {
      channelId: null,
      error: `Web scraping failed: ${error.message}`
    };
  }
}

/**
 * Try to resolve channel ID by testing RSS feed redirects
 */
async function resolveHandleByRssFeed(handle: string): Promise<ChannelLookupResult> {
  try {
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    // Try RSS feed with custom URL format
    const response = await axios.get(`https://www.youtube.com/feeds/videos.xml?user=${cleanHandle}`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      timeout: 5000
    });

    // If we get a successful response, try to extract channel ID from XML
    const xml = response.data;
    const match = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
    
    if (match && match[1]) {
      return {
        channelId: match[1],
        method: 'rss-feed'
      };
    }

    return {
      channelId: null,
      error: 'Channel ID not found in RSS feed'
    };

  } catch (error: any) {
    // Try to extract from redirect location
    if (error.response && error.response.headers.location) {
      const redirectMatch = error.response.headers.location.match(/channel\/([a-zA-Z0-9_-]{24})/);
      if (redirectMatch && redirectMatch[1]) {
        return {
          channelId: redirectMatch[1],
          method: 'rss-redirect'
        };
      }
    }

    return {
      channelId: null,
      error: `RSS feed method failed: ${error.message}`
    };
  }
}

/**
 * Resolve YouTube handle to channel ID using multiple fallback methods
 */
export async function resolveYouTubeHandle(input: string): Promise<ChannelLookupResult> {
  // If input already looks like a channel ID, return it
  if (input.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
    return {
      channelId: input,
      method: 'already-channel-id'
    };
  }

  // If input looks like a custom URL path, extract it
  let handle = input;
  if (input.includes('youtube.com/')) {
    const urlMatch = input.match(/youtube\.com\/(?:@|c\/|user\/)?([^\/\?]+)/);
    if (urlMatch) {
      handle = urlMatch[1];
    }
  }

  console.debug(`Attempting to resolve YouTube handle: ${handle}`);

  // Try web scraping first (most reliable)
  const webResult = await resolveHandleByWebScraping(handle);
  if (webResult.channelId) {
    console.debug(`✅ Resolved via web scraping: ${webResult.channelId}`);
    return webResult;
  }

  console.debug(`❌ Web scraping failed: ${webResult.error}`);

  // Try RSS feed method as fallback
  const rssResult = await resolveHandleByRssFeed(handle);
  if (rssResult.channelId) {
    console.debug(`✅ Resolved via RSS feed: ${rssResult.channelId}`);
    return rssResult;
  }

  console.debug(`❌ RSS feed failed: ${rssResult.error}`);

  // All methods failed
  return {
    channelId: null,
    error: `Failed to resolve handle "${input}". Tried web scraping and RSS feed methods.`
  };
}
