import { Client, EmbedBuilder, TextBasedChannel, GuildTextBasedChannel } from 'discord.js';
import { Plugin } from '../types';
import { youtube } from './commands/youtube';
import { YouTubeSubscription } from '../../db/models';
import { XMLTubeInfoFetcher } from '../../utils/xmlTubeInfoFetcher';

let interval: NodeJS.Timeout | undefined;

export const youtubePlugin: Plugin = {
  name: 'youtube',
  description: 'Notifies about new YouTube uploads',
  authors: ['GuikiPT'],
  commands: [youtube],
  events: [],
  global: true,
  async load(client: Client) {
    console.log('[YouTube Plugin] Setting up YouTube subscription checker (1 minute intervals)');
    
    // Run an immediate check first
    console.log('[YouTube Plugin] Running initial subscription check...');
    const initialSubs = await YouTubeSubscription.findAll();
    console.log(`[YouTube Plugin] Found ${initialSubs.length} subscription(s) in database`);
    
    interval = setInterval(async () => {
      console.log('[YouTube Plugin] Starting YouTube subscription check...');
      const subs = await YouTubeSubscription.findAll();
      console.log(`[YouTube Plugin] Found ${subs.length} subscription(s) to check`);
      
      for (const sub of subs) {
        try {
          console.log(`[YouTube Plugin] Checking channel ID: ${sub.youtubeChannelId}`);
          const info = await XMLTubeInfoFetcher(sub.youtubeChannelId);
          if (!info || !info.videos || info.videos.length === 0) {
            console.log(`[YouTube Plugin] No videos found for channel ID: ${sub.youtubeChannelId}`);
            continue;
          }
          const latest = info.videos[0];
          if (sub.lastVideoId === latest.video_id) {
            console.log(`[YouTube Plugin] No new video for channel: ${info.author.name} (latest: ${latest.video_id})`);
            continue;
          }
          console.log(`[YouTube Plugin] New video detected for channel: ${info.author.name} - ${latest.title}`);
          const channel = await client.channels.fetch(sub.discordChannelId).catch(() => null);
          if (channel && channel.isTextBased()) {
            try {
              const embed = new EmbedBuilder()
                .setTitle(latest.title?.substring(0, 256) || 'New Video') // Discord title limit
                .setURL(latest.url)
                .setTimestamp(new Date(latest.published_at * 1000));
              
              // Add description if it exists and is not too long
              if (latest.description) {
                embed.setDescription(latest.description.substring(0, 4096)); // Discord description limit
              }
              
              // Add thumbnail if it exists
              if (latest.thumbnails?.max_res_default) {
                embed.setImage(latest.thumbnails.max_res_default);
              }
              
              const mention = sub.mentionRoleId ? `<@&${sub.mentionRoleId}> ` : '';
              const content = `${mention}New video from ${info.author.name}!`;
              
              await (channel as GuildTextBasedChannel).send({ content, embeds: [embed] });
              sub.lastVideoId = latest.video_id;
              await sub.save();
              console.log(`[YouTube Plugin] Successfully notified about new video: ${latest.title}`);
            } catch (sendError) {
              console.error(`[YouTube Plugin] Failed to send notification for channel ${sub.youtubeChannelId}:`, sendError);
              // Still update the lastVideoId to avoid spamming failed attempts
              sub.lastVideoId = latest.video_id;
              await sub.save();
            }
          } else {
            console.log(`[YouTube Plugin] Discord channel not found or not text-based: ${sub.discordChannelId}`);
          }
        } catch (err) {
          console.error(`[YouTube Plugin] Check failed for channel ${sub.youtubeChannelId}:`, err);
        }
      }
      console.log('[YouTube Plugin] YouTube subscription check completed');
    }, 1 * 60 * 1000);
  },
  async unload() {
    if (interval) clearInterval(interval);
  }
};
