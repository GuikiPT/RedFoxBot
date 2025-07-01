import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { resolveYouTubeHandle } from '../../../../utils/youtubeHandleResolver';
import { XMLTubeInfoFetcher } from '../../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';

export const lookupSubcommand: SubcommandHandler = {
  name: 'lookup',
  async execute(interaction: ChatInputCommandInteraction) {
    const handle = interaction.options.getString('handle', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await resolveYouTubeHandle(handle);

    if (result.channelId) {
      const channelInfo = await XMLTubeInfoFetcher(result.channelId);
      const channelAvatar = await getYouTubeChannelAvatar(result.channelId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ YouTube Channel Found')
        .addFields(
          { name: 'Input', value: handle, inline: true },
          { name: 'Channel ID', value: result.channelId, inline: true },
          { name: 'Method', value: result.method || 'unknown', inline: true }
        )
        .setTimestamp();

      if (channelInfo) {
        embed.addFields(
          { name: 'Channel Name', value: channelInfo.author.name, inline: true },
          { name: 'Videos Found', value: channelInfo.videos.length.toString(), inline: true }
        );
        embed.setURL(channelInfo.author.url);
      } else if (result.channelName) {
        embed.addFields(
          { name: 'Channel Name', value: result.channelName, inline: true }
        );
      }

      if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Channel Not Found')
        .setDescription(result.error || 'Could not resolve the YouTube handle')
        .addFields(
          { name: 'Input', value: handle, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
