import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from './types';
import { YouTubeSubscription } from '../../../../db/models';
import { resolveYouTubeHandle } from '../../../../utils/youtubeHandleResolver';
import { XMLTubeInfoFetcher } from '../../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';
import { resolveYouTubeChannelId, createErrorEmbed } from '../../utils/helpers';

export const unsubscribeSubcommand: SubcommandHandler = {
  name: 'unsubscribe',
  async execute(interaction: ChatInputCommandInteraction) {
    const channelInput = interaction.options.getString('channel', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { channelId, error } = await resolveYouTubeChannelId(channelInput);
    if (!channelId) {
      const embed = createErrorEmbed('❌ Error', error!);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Only delete if that channel matches the one saved for this guild
    const existing = await YouTubeSubscription.findOne({
      where: { guildId: interaction.guildId, youtubeChannelId: channelId },
    });
    
    if (existing) {
      await existing.destroy();
      const channelInfo = await XMLTubeInfoFetcher(channelId);
      const channelName = channelInfo?.author.name;
      const channelAvatar = await getYouTubeChannelAvatar(channelId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Unsubscribed')
        .addFields(
          { name: 'Channel', value: channelName || 'Unknown', inline: true },
          { name: 'Channel ID', value: channelId, inline: true }
        )
        .setTimestamp();

      if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Subscription Not Found')
        .setDescription(`No subscription found for ${channelId}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
