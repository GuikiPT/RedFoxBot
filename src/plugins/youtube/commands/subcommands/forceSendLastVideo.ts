import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from './types';
import { YouTubeSubscription } from '../../../../db/models';
import { XMLTubeInfoFetcher } from '../../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';
import { createVideoEmbed } from '../../utils/createVideoEmbed';

// Helper function to format role mentions correctly
function formatRoleMention(roleId: string, guildId: string): string {
  if (roleId === guildId) {
    // @everyone role
    return '@everyone';
  } else {
    // Regular role
    return `<@&${roleId}>`;
  }
}

export const forceSendLastVideoSubcommand: SubcommandHandler = {
  name: 'force-send-last-video',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Check if there's a subscription for this guild
    const subscription = await YouTubeSubscription.findOne({
      where: { guildId: interaction.guildId },
    });

    if (!subscription) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ No Subscription Found')
        .setDescription('No YouTube subscription found for this guild. Use `/youtube subscribe` first.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      // Fetch channel info and latest video
      const channelInfo = await XMLTubeInfoFetcher(subscription.youtubeChannelId);
      if (!channelInfo || !channelInfo.videos || channelInfo.videos.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ No Videos Found')
          .setDescription(`No videos found for the subscribed channel: ${subscription.youtubeChannelId}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const latestVideo = channelInfo.videos[0];
      const channelAvatar = await getYouTubeChannelAvatar(subscription.youtubeChannelId);

      // Get the Discord channel
      const discordChannel = await interaction.client.channels.fetch(subscription.discordChannelId).catch(() => null);
      if (!discordChannel || !discordChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Channel Not Found')
          .setDescription(`Discord channel <#${subscription.discordChannelId}> not found or not accessible.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Create the video notification embed and buttons
      const { embed: videoEmbed, buttonRow } = createVideoEmbed({
        video: latestVideo,
        author: channelInfo.author,
        channelAvatar: channelAvatar || undefined
      });

      // Determine mention text
      let mention = '';
      if (subscription.mentionRoleId) {
        mention = formatRoleMention(subscription.mentionRoleId, subscription.guildId) + ' ';
      }

      // Send the video notification
      await (discordChannel as GuildTextBasedChannel).send({
        content: mention,
        embeds: [videoEmbed],
        components: [buttonRow],
      });

      // Send confirmation to the user
      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Video Sent Successfully')
        .setDescription(`Forced sending of the latest video from **${channelInfo.author.name}** to <#${subscription.discordChannelId}>`)
        .addFields(
          { name: 'Video Title', value: latestVideo.title, inline: false },
          { name: 'Channel', value: channelInfo.author.name, inline: true },
          { name: 'Mention Role', value: subscription.mentionRoleId ? formatRoleMention(subscription.mentionRoleId, subscription.guildId) : 'None', inline: true }
        )
        .setTimestamp();

      if (channelAvatar) {
        confirmEmbed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Force send failed:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Failed to Send Video')
        .setDescription('An error occurred while trying to send the video notification.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
