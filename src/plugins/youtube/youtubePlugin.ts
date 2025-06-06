import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ContainerBuilder,
  GuildTextBasedChannel,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  MessageFlags,
} from 'discord.js';
import { Plugin } from '../types';
import { youtube } from './commands/youtube';
import { YouTubeSubscription } from '../../db/models';
import { XMLTubeInfoFetcher } from '../../utils/xmlTubeInfoFetcher';

let interval: NodeJS.Timeout | undefined;

async function checkSubscriptions(client: Client) {
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

      if (!sub.lastVideoId) {
        sub.lastVideoId = latest.video_id;
        await sub.save();
        console.log(`[YouTube Plugin] Initialized ${sub.youtubeChannelId} with video ${latest.video_id}`);
        continue;
      }

      if (sub.lastVideoId === latest.video_id) {
        console.log(
          `[YouTube Plugin] No new video for channel: ${info.author.name} (latest: ${latest.video_id})`
        );
        continue;
      }

      console.log(
        `[YouTube Plugin] New video detected for channel: ${info.author.name} - ${latest.title}`
      );
      const channel = await client.channels.fetch(sub.discordChannelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        try {
          // 1) Build the "title" and "subtitle" text displays
          const titleComponent = new TextDisplayBuilder().setContent(
            `## [${latest.title}](${latest.url})`
          );
          const subtitleComponent = new TextDisplayBuilder().setContent(
            `New video from ${info.author.name}`
          );

          // 2) Build the media gallery item (thumbnail)
          const mediaItem = new MediaGalleryItemBuilder()
            .setURL(latest.thumbnails?.max_res_default || '')
            .setDescription(`${latest.title} Thumbnail`);

          // 3) Build the two link-buttons: "Open Video" and "Open Channel"
          const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel('Open Video')
              .setEmoji({ name: '📽️' })
              .setURL(latest.url),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel('Open Channel')
              .setEmoji({ name: '📽️' })
              .setURL(info.author.url)
          );

          // 4) Compose the ContainerBuilder with separators, text, media gallery, and a placeholder for the button row
          const containerComponent = new ContainerBuilder()
            // Separator above the title
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            )
            // Title line (markdown link)
            .addTextDisplayComponents(titleComponent)
            // Subtitle line ("New video from …")
            .addTextDisplayComponents(subtitleComponent)
            // Divider between subtitle and thumbnail gallery
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            // Media gallery with one thumbnail
            .addMediaGalleryComponents(
              new MediaGalleryBuilder().addItems(mediaItem)
            )
            // Divider between gallery and buttons
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );
          
          // 5) Determine mention text (@everyone or role mention)
          let mention = '';
          if (sub.mentionRoleId) {
            if (sub.mentionRoleId === sub.guildId) {
              mention = '@everyone ';
            } else {
              mention = `<@&${sub.mentionRoleId}> `;
            }
          }

          // 6) Send the message with content, the v2 container, and the v1 action row of buttons
          await (channel as GuildTextBasedChannel).send({
            content: mention,
            components: [containerComponent, buttonRow],
            flags: MessageFlags.IsComponentsV2,
          });

          // 7) Update lastVideoId
          sub.lastVideoId = latest.video_id;
          await sub.save();
          console.log(
            `[YouTube Plugin] Successfully notified about new video: ${latest.title}`
          );
        } catch (sendError) {
          console.error(
            `[YouTube Plugin] Failed to send notification for channel ${sub.youtubeChannelId}:`,
            sendError
          );
          // Prevent re-notification
          sub.lastVideoId = latest.video_id;
          await sub.save();
        }
      } else {
        console.log(
          `[YouTube Plugin] Discord channel not found or not text-based: ${sub.discordChannelId}`
        );
      }
    } catch (err) {
      console.error(
        `[YouTube Plugin] Check failed for channel ${sub.youtubeChannelId}:`,
        err
      );
    }
  }
  console.log('[YouTube Plugin] YouTube subscription check completed');
}

export const youtubePlugin: Plugin = {
  name: 'youtube',
  description: 'Notifies about new YouTube uploads',
  authors: ['GuikiPT'],
  commands: [youtube],
  events: [],
  global: true,
  async load(client: Client) {
    console.log('[YouTube Plugin] Setting up YouTube subscription checker (1 minute intervals)');
    await checkSubscriptions(client).catch(err =>
      console.error('[YouTube Plugin] Initial check failed:', err)
    );
    interval = setInterval(
      () =>
        checkSubscriptions(client).catch(err =>
          console.error('[YouTube Plugin] Periodic check failed:', err)
        ),
      1 * 60 * 1000
    );
  },
  async unload() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  },
};
