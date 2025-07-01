import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { extractVideoId } from '../../utils/extractVideoId';
import { fetchVideoInfo } from '../../utils/fetchVideoInfo';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';
import { createVideoEmbed } from '../../utils/createVideoEmbed';
import { fetchTextChannel, createErrorEmbed } from '../../utils/helpers';

export const forceSendVideoSubcommand: SubcommandHandler = {
  name: 'force-send-video',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get the video URL from the command options
    const videoUrl = interaction.options.getString('url', true);
    const channelOption = interaction.options.getChannel('channel');
    
    // Use the specified channel or the current channel
    const targetChannel = channelOption || interaction.channel;
    
    if (!targetChannel) {
      const embed = createErrorEmbed('❌ Invalid Channel', 'Could not determine the target channel.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Fetch the actual channel to ensure we have the right type
    const actualChannel = await fetchTextChannel(interaction.client, targetChannel.id);
    if (!actualChannel) {
      const embed = createErrorEmbed('❌ Invalid Channel', 'The target channel is not a text channel or cannot be accessed.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Invalid YouTube URL')
        .setDescription('Please provide a valid YouTube video URL or video ID.')
        .addFields(
          { 
            name: 'Supported formats:', 
            value: '• `https://youtube.com/watch?v=VIDEO_ID`\n• `https://youtu.be/VIDEO_ID`\n• `https://youtube.com/shorts/VIDEO_ID`\n• Direct video ID', 
            inline: false 
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      // Fetch video information
      console.debug(`[Force Send Video] Fetching info for video ID: ${videoId}`);
      const videoInfo = await fetchVideoInfo(videoId);
      if (!videoInfo) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Video Not Found')
          .setDescription(`Could not fetch information for video ID: \`${videoId}\`\n\nThe video might be private, deleted, or the URL is invalid.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      console.debug(`[Force Send Video] Successfully fetched video: ${videoInfo.video.title} by ${videoInfo.author.name} (Channel ID: ${videoInfo.video.channel_id})`);

      // Get channel avatar (only if we have a valid channel ID)
      let channelAvatar: string | null = null;
      if (videoInfo.video.channel_id && videoInfo.video.channel_id !== 'UNKNOWN' && videoInfo.video.channel_id.length >= 10) {
        console.debug(`[Force Send Video] Fetching channel avatar for: ${videoInfo.video.channel_id}`);
        channelAvatar = await getYouTubeChannelAvatar(videoInfo.video.channel_id);
      } else {
        console.warn(`[Force Send Video] Skipping channel avatar fetch for invalid channel ID: ${videoInfo.video.channel_id}`);
      }

      // Create the video embed and buttons
      const { embed: videoEmbed, buttonRow } = createVideoEmbed({
        video: videoInfo.video,
        author: videoInfo.author,
        channelAvatar: channelAvatar || undefined
      });

      // Send the video to the target channel
      await (actualChannel as GuildTextBasedChannel).send({
        embeds: [videoEmbed],
        components: [buttonRow],
      });

      // Send confirmation to the user
      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Video Sent Successfully')
        .setDescription(`Successfully sent video information to <#${actualChannel.id}>.`)
        .addFields(
          { name: 'Video Title', value: videoInfo.video.title, inline: false },
          { name: 'Channel', value: videoInfo.author.name, inline: true },
          { name: 'Video ID', value: videoId, inline: true },
          { name: 'Target Channel', value: `<#${actualChannel.id}>`, inline: true }
        )
        .setTimestamp();

      if (channelAvatar) {
        confirmEmbed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Force send video failed:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Failed to Send Video')
        .setDescription('An error occurred while trying to fetch or send the video information.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
