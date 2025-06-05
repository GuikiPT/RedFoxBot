import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { config } from '../../../config/config';

export const debug: Command = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Show debug information'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!config.BOT_OWNER_IDS.includes(interaction.user.id)) {
      await interaction.reply({ content: 'Only bot owners can use this command.', ephemeral: true });
      return;
    }

    const memory = process.memoryUsage().rss / 1024 / 1024;
    await interaction.reply({ content: `Memory usage: ${memory.toFixed(2)} MB`, ephemeral: true });
  }
};
