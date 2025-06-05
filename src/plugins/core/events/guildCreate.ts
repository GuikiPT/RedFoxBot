import { Client, Guild } from "discord.js";
import { EventHandler } from "../../types";

export const guildCreate: EventHandler = {
  name: "guildCreate",
  execute: async (client: Client, guild: Guild) => {
    console.log(`Bot joined new guild: ${guild.name} (${guild.id})`);
    try {
      // Get commands from the plugin manager attached to the client
      const pluginManager = (client as any).pluginManager;
      if (pluginManager) {
        const commands = pluginManager.getAllCommands().map((command: any) => command.data);
        
        const { REST, Routes } = await import("discord.js");
        const { config } = await import("../../../config/config");
        
        const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
        
        await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guild.id), {
          body: commands,
        });
        
        console.log(`Commands deployed to ${guild.name}`);
      }
    } catch (error) {
      console.error(`Failed to deploy commands to ${guild.name}:`, error);
    }
  }
};
