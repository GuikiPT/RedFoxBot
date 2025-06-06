declare module 'xmltubeinfofetcher' {
  interface VideoThumbnails {
    max_res_default: string;
  }

  interface VideoInfo {
    channel_id: string;
    video_id: string;
    title: string;
    url: string;
    description?: string;
    published_at: number;
    thumbnails: VideoThumbnails;
  }

  interface AuthorInfo {
    name: string;
  }

  interface ChannelInfo {
    author: AuthorInfo;
    videos: VideoInfo[];
  }

  export function XMLTubeInfoFetcher(channelId: string): Promise<ChannelInfo | null>;
}
