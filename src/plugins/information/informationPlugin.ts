import { Client } from "discord.js";
import { Plugin } from "../types";
import { ping } from "./commands/ping";
import chalk from "chalk";

export const informationPlugin: Plugin = {
  name: "information",
  description: "Information and utility commands",
  authors: ["GuikiPT"],
  commands: [ping],
  events: [],
  global: true,
  load: async (client: Client) => {
    console.log(`❓ ${chalk.bold(chalk.red('Information plugin loaded!'))}`);
  }
};
