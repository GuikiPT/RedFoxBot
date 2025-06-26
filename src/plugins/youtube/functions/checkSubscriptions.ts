import {
    Client,
    GuildTextBasedChannel,
} from 'discord.js';
import { YouTubeSubscription } from '../../../db/models';
import { XMLTubeInfoFetcher } from '../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../utils/youtubeChannelAvatar';
import { createVideoEmbed } from '../utils/createVideoEmbed';

export async function checkSubscriptions(client: Client) {
    console.debug('[YouTube Plugin] Starting YouTube subscription check...');
    const subs = await YouTubeSubscription.findAll();
    console.debug(`[YouTube Plugin] Found ${subs.length} subscription(s) to check`);

    for (const sub of subs) {
        try {
            console.debug(`[YouTube Plugin] Checking channel ID: ${sub.youtubeChannelId}`);
            const info = await XMLTubeInfoFetcher(sub.youtubeChannelId);
            if (!info || !info.videos || info.videos.length === 0) {
                console.debug(`[YouTube Plugin] No videos found for channel ID: ${sub.youtubeChannelId}`);
                continue;
            }
            const latest = info.videos[0];

            if (!sub.lastVideoId) {
                sub.lastVideoId = latest.video_id;
                await sub.save();
                console.debug(`[YouTube Plugin] Initialized ${sub.youtubeChannelId} with video ${latest.video_id}`);
                continue;
            }

            if (sub.lastVideoId === latest.video_id) {
                console.debug(
                    `[YouTube Plugin] No new video for channel: ${info.author.name} (latest: ${latest.video_id})`
                );
                continue;
            }

            console.debug(
                `[YouTube Plugin] New video detected for channel: ${info.author.name} - ${latest.title}`
            );
            const channel = await client.channels.fetch(sub.discordChannelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                try {
                    // Get channel avatar
                    const channelAvatar = await getYouTubeChannelAvatar(sub.youtubeChannelId);

                    // Create the video notification embed and buttons
                    const { embed: videoEmbed, buttonRow } = createVideoEmbed({
                        video: latest,
                        author: info.author,
                        channelAvatar: channelAvatar || undefined
                    });

                    // Determine mention text (@everyone or role mention)
                    let mention = '';
                    if (sub.mentionRoleId) {
                        if (sub.mentionRoleId === sub.guildId) {
                            mention = '@everyone ';
                        } else {
                            mention = `<@&${sub.mentionRoleId}> `;
                        }
                    }

                    // Send the message with the embed and buttons
                    await (channel as GuildTextBasedChannel).send({
                        content: mention,
                        embeds: [videoEmbed],
                        components: [buttonRow],
                    });

                    // Update lastVideoId
                    sub.lastVideoId = latest.video_id;
                    await sub.save();
                    console.debug(
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
                console.debug(
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
    console.debug('[YouTube Plugin] YouTube subscription check completed');
}
