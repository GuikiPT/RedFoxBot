import { Client, Guild } from "discord.js";
import { EventHandler } from "../../types";
import { handleError } from "../../../utils/errorHandler";
import { deployGuildCommands } from "../../../utils/commandDeployer";

export const guildCreate: EventHandler = {
  name: "guildCreate",
  execute: async (client: Client, guild: Guild) => {
    console.log(`🎉 Joined guild: ${guild.name} (${guild.id})`);
    try {
      // Get commands from the plugin manager attached to the client
      const pluginManager = (client as any).pluginManager;
      if (pluginManager) {
        await deployGuildCommands(pluginManager, guild.id);
      }
    } catch (error) {
      handleError(error, `Failed to deploy commands to ${guild.name}`);
    }
  }
};
