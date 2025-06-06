// Node Modules
import axios from 'axios';
import * as xml2js from 'xml2js';

export interface VideoThumbnails {
  default: string;
  hq_default: string;
  mq_default: string;
  sd_default: string;
  max_res_default: string;
}

export interface VideoCommunity {
  star_rating: any;
  statistics: any;
}

export interface VideoInfo {
  channel_id: string;
  video_id: string;
  title: string;
  url: string;
  description: string;
  thumbnails: VideoThumbnails;
  community: VideoCommunity;
  published_at: number;
  lastUpdate_at: number;
}

export interface AuthorInfo {
  name: string;
  url: string;
  id: string;
  created_at: number;
}

export interface ChannelInfo {
  author: AuthorInfo;
  videos: VideoInfo[];
}

export async function XMLTubeInfoFetcher(provided_channel_id: string): Promise<ChannelInfo | null> {
  if (!provided_channel_id) {
    console.error(
      new Error(`An channel_id is required.`).stack
    );
    return null;
  }

  try {
    const response = await axios.get(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${provided_channel_id}`,
      { timeout: 10000 }
    );

    if (response.status === 200) {
      const xml = response.data;
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xml);
      const data = result.feed;

      const parsed_videos: VideoInfo[] = [];

      // Handle case where there might be no entries or single entry
      const entries = Array.isArray(data.entry) ? data.entry : (data.entry ? [data.entry] : []);

      for (const entry of entries) {
        const parsedEntry: VideoInfo = {
          channel_id: entry['yt:channelId'],
          video_id: entry['yt:videoId'],
          title: entry['media:group']['media:title'],
          url: entry['link']['$']['href'],
          description: entry['media:group']['media:description'] || '',
          thumbnails: {
            default: `https://i2.ytimg.com/vi/${entry['yt:videoId']}/default.jpg`,
            hq_default: `https://i2.ytimg.com/vi/${entry['yt:videoId']}/hqdefault.jpg`,
            mq_default: `https://i2.ytimg.com/vi/${entry['yt:videoId']}/mqdefault.jpg`,
            sd_default: `https://i2.ytimg.com/vi/${entry['yt:videoId']}/sddefault.jpg`,
            max_res_default: `https://i2.ytimg.com/vi/${entry['yt:videoId']}/maxresdefault.jpg`,
          },
          community: {
            star_rating: entry['media:group']['media:community']['media:starRating']['$'],
            statistics: entry['media:group']['media:community']['media:statistics']['$']
          },
          published_at: new Date(entry['published']).getTime() / 1000,
          lastUpdate_at: new Date(entry['updated']).getTime() / 1000,
        };
        parsed_videos.push(parsedEntry);
      }

      const reply: ChannelInfo = {
        author: {
          name: data.author.name,
          url: data.author.uri,
          id: data.author.uri.replace('https://www.youtube.com/channel/', ''),
          created_at: new Date(data.published).getTime() / 1000
        },
        videos: parsed_videos,
      };
      return reply;
    }
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error(`YouTube request timed out for channel ${provided_channel_id}`);
      return null;
    }
    if (error.response && error.response.status === 404) {
      console.error(
        new Error(`YouTube feed not found (status 404) for "${provided_channel_id}" channel id.\n`).stack
      );
      return null;
    }
    console.error(new Error(`Error while fetching Youtube Feed:\n${error.stack}`));
    return null;
  }
  return null;
}
