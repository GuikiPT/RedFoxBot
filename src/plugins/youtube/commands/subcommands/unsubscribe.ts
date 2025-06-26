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

// Helper function to detect if input is a channel ID or handle
function isChannelId(input: string): boolean {
  // YouTube channel IDs are 24 characters starting with UC
  return /^UC[a-zA-Z0-9_-]{22}$/.test(input);
}

export const unsubscribeSubcommand: SubcommandHandler = {
  name: 'unsubscribe',
  async execute(interaction: ChatInputCommandInteraction) {
    const channelInput = interaction.options.getString('channel', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let channelId: string;
    if (isChannelId(channelInput)) {
      channelId = channelInput;
    } else {
      const result = await resolveYouTubeHandle(channelInput);
      if (!result.channelId) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Error')
          .setDescription(`Could not resolve "${channelInput}": ${result.error}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
      channelId = result.channelId;
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
