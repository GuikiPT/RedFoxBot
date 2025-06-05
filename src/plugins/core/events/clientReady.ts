import { Client } from "discord.js";
import { EventHandler } from "../../types";

export const clientReady: EventHandler = {
  name: "ready",
  once: true,
  execute: async (client: Client) => {
    console.log(`Discord bot is ready! 🤖`);
    console.log(`Logged in as ${client.user?.tag}`);
  }
};
