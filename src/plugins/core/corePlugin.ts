import { Client } from "discord.js";
import { Plugin } from "../types";
import { clientReady } from "./events/clientReady";
import { interactionCreate } from "./events/interactionCreate";
import { guildCreate } from "./events/guildCreate";

export const corePlugin: Plugin = {
  name: "core",
  description: "Core functionality for the Discord bot",
  commands: [],
  events: [clientReady, interactionCreate, guildCreate],
  load: async (client: Client) => {
    console.log("Core plugin loaded - handling basic bot functionality");
  }
};
