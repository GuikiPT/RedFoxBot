import { Client, Guild } from "discord.js";
import { EventHandler } from "../../types";
import { handleError } from "../../../utils/errorHandler";
import { commandsChanged } from "../../../utils/commandCache";

export const guildCreate: EventHandler = {
  name: "guildCreate",
  execute: async (client: Client, guild: Guild) => {
    console.log(`Bot joined new guild: ${guild.name} (${guild.id})`);
    try {
      // Get commands from the plugin manager attached to the client
      const pluginManager = (client as any).pluginManager;
      if (pluginManager) {
        const commands = pluginManager.getCommandsForGuild(guild.id).map((command: any) => command.data);
        if (commands.length === 0) {
          return;
        }
        
        const { REST, Routes } = await import("discord.js");
        const { config } = await import("../../../config/config");

        if (commandsChanged(guild.id, commands.map((c: any) => c.toJSON()))) {
          const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

          await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guild.id), {
            body: commands,
          });

          console.log(`Commands deployed to ${guild.name}`);
        }
      }
    } catch (error) {
      handleError(error, `Failed to deploy commands to ${guild.name}`);
    }
  }
};
