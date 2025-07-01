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
          .setColor(0xff0000)
          .setTitle('❌ Starboard Not Configured')
          .setDescription('The starboard is not configured for this server. Use `/starboard config` to set it up first.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Update the enabled status
      config.enabled = isEnabling;
      await config.save();

      const embed = new EmbedBuilder()
        .setColor(isEnabling ? 0x00ff00 : 0xff6600)
        .setTitle(`⭐ Starboard ${isEnabling ? 'Enabled' : 'Disabled'}`)
        .setDescription(
          isEnabling 
            ? 'The starboard has been enabled for this server.' 
            : 'The starboard has been disabled for this server.'
        )
        .addFields(
          { name: 'Channel', value: `<#${config.channelId}>`, inline: true },
          { name: 'Emoji', value: config.emoji, inline: true },
          { name: 'Threshold', value: config.emojiThreshold.toString(), inline: true },
          { name: 'Status', value: isEnabling ? '🟢 Enabled' : '🔴 Disabled', inline: false }
        )
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
