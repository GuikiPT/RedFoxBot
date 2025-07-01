import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { StarBoardConfig } from '../../../../db/models/StarBoardConfig';

export const enabledSubcommand: SubcommandHandler = {
  name: 'enabled',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('This command can only be used in a server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const action = interaction.options.getString('action', true);
    const isEnabling = action === 'enable';

    try {
      // Find existing starboard config
      const config = await StarBoardConfig.findOne({
        where: { guildId: interaction.guildId },
      });

      if (!config) {
        const embed = new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle('❌ Starboard Not Configured')
          .setDescription('The starboard is not configured for this server.')
          .addFields({
            name: '🔧 Setup Required',
            value: 'Use `/starboard config` to configure the starboard first.',
            inline: false
          })
          .setFooter({ 
            text: `Requested by ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Update the enabled status
      config.enabled = isEnabling;
      await config.save();

      const statusColor = isEnabling ? 0x00ff00 : 0x808080;
      const statusIcon = isEnabling ? '🟢' : '🔴';
      const actionText = isEnabling ? 'enabled' : 'disabled';

      const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(`⭐ Starboard ${isEnabling ? 'Enabled' : 'Disabled'}`)
        .setDescription(`The starboard has been successfully **${actionText}** for this server.`)
        .addFields(
          { name: '📍 Channel', value: `<#${config.channelId}>`, inline: true },
          { name: '⭐ Emoji', value: config.emoji, inline: true },
          { name: '📊 Threshold', value: `${config.emojiThreshold} reaction${config.emojiThreshold !== 1 ? 's' : ''}`, inline: true },
          { name: `${statusIcon} Status`, value: isEnabling ? 'Enabled' : 'Disabled', inline: true },
          { name: '\u200b', value: '\u200b', inline: true }, // Empty field for spacing
          { name: '📅 Updated', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ 
          text: `${isEnabling ? 'Enabled' : 'Disabled'} by ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error updating starboard status:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Update Failed')
        .setDescription('Failed to update the starboard status. Please try again.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
