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
import { isChannelId, formatRoleMention } from '../../utils/helpers';

export const setRoleSubcommand: SubcommandHandler = {
  name: 'set-role',
  async execute(interaction: ChatInputCommandInteraction) {
    const channelInput = interaction.options.getString('channel', true);
    const role = interaction.options.getRole('mention_role');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let channelId: string;
    let channelName: string | undefined;
    let channelAvatar: string | null = null;

    if (isChannelId(channelInput)) {
      channelId = channelInput;
      const channelInfo = await XMLTubeInfoFetcher(channelId);
      if (channelInfo) {
        channelName = channelInfo.author.name;
      }
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
      const channelInfo = await XMLTubeInfoFetcher(channelId);
      if (channelInfo) {
        channelName = channelInfo.author.name;
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Error')
          .setDescription(`Found channel ID ${channelId} but couldn't verify it. The channel might not have any videos or RSS feed disabled.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // Get channel avatar
    channelAvatar = await getYouTubeChannelAvatar(channelId);

    // Ensure this matches the saved subscription
    const existing = await YouTubeSubscription.findOne({
      where: { guildId: interaction.guildId, youtubeChannelId: channelId },
    });

    if (!existing) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Subscription Not Found')
        .setDescription(`No subscription found for ${channelName || channelInput} (${channelId}).`)
        .setTimestamp();

      if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [embed] });
    } else {
      existing.mentionRoleId = role?.id ?? null;
      await existing.save();

      const mentionText = role ? formatRoleMention(role.id, interaction.guildId!) : 'None';
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Updated Mention Role')
        .addFields(
          { name: 'Channel', value: channelName || 'Unknown', inline: true },
          { name: 'Channel ID', value: channelId, inline: true },
          { name: 'Mention Role', value: mentionText, inline: true }
        )
        .setTimestamp();

      if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
