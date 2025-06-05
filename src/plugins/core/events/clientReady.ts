import { Client } from "discord.js";
import { EventHandler } from "../../types";
import { commandsChanged } from "../../../utils/commandCache";
import { handleError } from "../../../utils/errorHandler";

export const clientReady: EventHandler = {
  name: "ready",
  once: true,
  execute: async (client: Client) => {
    try {
      console.log(`Discord bot is ready! 🤖`);
      console.log(`Logged in as ${client.user?.tag}`);

      const { REST, Routes } = await import("discord.js");
      const { config } = await import("../../../config/config");

      const pluginManager = (client as any).pluginManager;
      if (!pluginManager) {
        console.warn("Plugin manager not found on client");
        return;
      }

      const globalCommands = pluginManager.getGlobalCommands().map((command: any) => command.data);
      const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

      if (globalCommands.length > 0) {
        if (commandsChanged("global", globalCommands.map((c: any) => c.toJSON()))) {
          await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
            body: globalCommands,
          });
          console.log("Global commands deployed");
        } else {
          console.log("Global commands up to date");
        }
      }

      // Deploy guild specific commands

      const guildIds = new Set<string>();
      for (const plugin of pluginManager.plugins.values()) {
        if (plugin.guildIds) {
          plugin.guildIds.forEach((id: string) => guildIds.add(id));
        }
      }

      for (const guildId of guildIds) {
        const guildCommands = pluginManager.getCommandsForGuild(guildId).map((command: any) => command.data);
        if (guildCommands.length === 0) continue;

        if (commandsChanged(guildId, guildCommands.map((c: any) => c.toJSON()))) {
          await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId), {
            body: guildCommands,
          });
          console.log(`Commands deployed to ${guildId}`);
        }
      }
    } catch (error) {
      handleError(error, "clientReady");
    }
  }
};
