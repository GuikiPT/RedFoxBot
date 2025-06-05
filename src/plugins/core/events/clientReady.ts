import { Client } from "discord.js";
import { EventHandler } from "../../types";

export const clientReady: EventHandler = {
  name: "ready",
  once: true,
  execute: async (client: Client) => {
    console.log(`Discord bot is ready! 🤖`);
    console.log(`Logged in as ${client.user?.tag}`);

    const pluginManager = (client as any).pluginManager;
    if (pluginManager) {
      const commands = pluginManager.getGlobalCommands().map((command: any) => command.data);
      if (commands.length > 0) {
        const { REST, Routes } = await import("discord.js");
        const { config } = await import("../../../config/config");

        const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
          body: commands,
        });

        console.log("Global commands deployed");
      }
    }
  }
};
