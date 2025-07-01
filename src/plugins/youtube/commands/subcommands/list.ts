import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { YouTubeSubscription } from '../../../../db/models';
import { XMLTubeInfoFetcher } from '../../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';
import { formatRoleMention } from '../../utils/helpers';

export const listSubcommand: SubcommandHandler = {
  name: 'list',
  async execute(interaction: ChatInputCommandInteraction) {
    const existing = await YouTubeSubscription.findOne({
      where: { guildId: interaction.guildId },
    });
    
    if (!existing) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ No Subscription Found')
        .setDescription('No subscription found for this guild.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      const channelInfo = await XMLTubeInfoFetcher(existing.youtubeChannelId);
      const channelName = channelInfo?.author.name || 'Unknown';
      const channelUrl = channelInfo?.author.url || '';
      const mentionText = existing.mentionRoleId
        ? formatRoleMention(existing.mentionRoleId, existing.guildId)
        : 'None';

      // Get channel avatar
      const channelAvatar = await getYouTubeChannelAvatar(existing.youtubeChannelId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('📺 Current Subscription')
        .addFields(
          { name: 'Channel Name', value: channelName, inline: true },
          { name: 'Channel ID', value: existing.youtubeChannelId, inline: true },
          { name: 'Discord Channel', value: `<#${existing.discordChannelId}>`, inline: true },
          { name: 'Mention Role', value: mentionText, inline: true }
        )
        .setTimestamp();

      if (channelUrl) {
        embed.setURL(channelUrl);
      }

      if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
      }

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
