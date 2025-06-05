import { Client, Interaction } from "discord.js";
import { EventHandler } from "../../types";

export const interactionCreate: EventHandler = {
  name: "interactionCreate",
  execute: async (client: Client, interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    // Get the plugin manager from the client
    const pluginManager = (client as any).pluginManager;
    if (!pluginManager) {
      console.error("Plugin manager not found on client");
      return;
    }

    const command = pluginManager.getCommand(interaction.commandName);
    
    if (!command) {
      console.warn(`Command ${interaction.commandName} not found`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = "There was an error while executing this command!";
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};
