import { Client, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { Plugin } from '../types';
import { youtube } from './commands/youtube';
import { YouTubeSubscription } from '../../db/models';
import { XMLTubeInfoFetcher } from 'xmltubeinfofetcher';

let interval: NodeJS.Timeout | undefined;

export const youtubePlugin: Plugin = {
  name: 'youtube',
  description: 'Notifies about new YouTube uploads',
  authors: ['GuikiPT'],
  commands: [youtube],
  events: [],
  global: true,
  async load(client: Client) {
    interval = setInterval(async () => {
      const subs = await YouTubeSubscription.findAll();
      for (const sub of subs) {
        try {
          const info = await XMLTubeInfoFetcher(sub.youtubeChannelId);
          if (!info || !info.videos || info.videos.length === 0) continue;
          const latest = info.videos[0];
          if (sub.lastVideoId === latest.video_id) continue;
          const channel = await client.channels.fetch(sub.discordChannelId).catch(() => null);
          if (channel && channel.isTextBased()) {
            const embed = new EmbedBuilder()
              .setTitle(latest.title)
              .setURL(latest.url)
              .setImage(latest.thumbnails.max_res_default)
              .setDescription(latest.description ?? '')
              .setTimestamp(new Date(latest.published_at * 1000));
            await (channel as TextBasedChannel).send({ content: `New video from ${info.author.name}!`, embeds: [embed] });
            sub.lastVideoId = latest.video_id;
            await sub.save();
          }
        } catch (err) {
          console.error('YouTube check failed:', err);
        }
      }
    }, 5 * 60 * 1000);
  },
  async unload() {
    if (interval) clearInterval(interval);
  }
};
