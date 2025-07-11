import { Client } from "discord.js";
import { Plugin } from "../types";
import chalk from "chalk";
import { clientReady } from "./events/clientReady";
import { interactionCreate } from "./events/interactionCreate";
import { guildCreate } from "./events/guildCreate";

export const corePlugin: Plugin = {
  name: "core",
  description: "Core functionality for the Discord bot",
  authors: ["GuikiPT"],
  commands: [],
  events: [clientReady, interactionCreate, guildCreate],
  global: true,
  load: async (client: Client) => {
    console.log(`🧠 ${chalk.bold(chalk.magentaBright('Core plugin loaded!'))}`);
  }
};
