import { Client } from "discord.js";
import { EventHandler } from "../../types";
import { handleError } from "../../../utils/errorHandler";
import { deployGuildCommands, deployGlobalCommands } from "../../../utils/commandDeployer";

export const clientReady: EventHandler = {
  name: "ready",
  once: true,
  execute: async (client: Client) => {
    try {
      console.log(`🤖 RedFoxBot is now online!`);
      console.log(`Logged in as ${client.user?.tag}`);

      const pluginManager = (client as any).pluginManager;
      if (!pluginManager) {
        console.warn("Plugin manager not found on client");
        return;
      }

      await deployGlobalCommands(pluginManager);

      const guildIds = new Set<string>();
      for (const plugin of pluginManager.plugins.values()) {
        if (plugin.guildIds) {
          plugin.guildIds.forEach((id: string) => guildIds.add(id));
        }
      }

      for (const guildId of guildIds) {
        await deployGuildCommands(pluginManager, guildId);
      }
    } catch (error) {
      handleError(error, "clientReady");
    }
  }
};
