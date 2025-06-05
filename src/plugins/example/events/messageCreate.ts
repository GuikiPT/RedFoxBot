import { Client, Message } from "discord.js";
import { EventHandler } from "../../types";

export const messageCreate: EventHandler = {
  name: "messageCreate",
  execute: async (client: Client, message: Message) => {
    // Don't respond to bots
    if (message.author.bot) return;
    
    // Simple auto-response example
    if (message.content.toLowerCase().includes("good bot")) {
      await message.react("❤️");
    }
  }
};
