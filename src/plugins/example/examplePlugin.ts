import { Client } from "discord.js";
import { Plugin } from "../types";
import { hello } from "./commands/hello";
import { messageCreate } from "./events/messageCreate";

export const examplePlugin: Plugin = {
  name: "example",
  description: "Example plugin demonstrating commands and events",
  commands: [hello],
  events: [messageCreate],
  load: async (client: Client) => {
    console.log("Example plugin loaded - demonstrating plugin capabilities");
    
    // You can add initialization logic here
    // For example: setting up databases, timers, etc.
  },
  unload: async (client: Client) => {
    console.log("Example plugin unloaded - cleaning up resources");
    
    // Cleanup logic here
    // For example: closing database connections, clearing timers, etc.
  }
};
