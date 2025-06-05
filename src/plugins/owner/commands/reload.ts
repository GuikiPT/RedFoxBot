import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { config } from '../../../config/config';

export const reload: Command = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all plugins'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      if (!config.BOT_OWNER_IDS.includes(interaction.user.id)) {
        await interaction.reply({ content: 'Only bot owners can use this command.', ephemeral: true });
        return;
      }

      const loader = (interaction.client as any).pluginLoader;
      if (!loader) {
        await interaction.reply({ content: 'Plugin loader not found.', ephemeral: true });
        return;
      }

      await interaction.reply({ content: 'Reloading plugins...', ephemeral: true });
      await loader.unloadAllPlugins();
      await loader.loadAllPlugins();
      await interaction.followUp({ content: 'Plugins reloaded.', ephemeral: true });
    } catch (error) {
      console.error('Reload command failed:', error);
    }
  }
};
