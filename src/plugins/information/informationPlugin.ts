import { Client } from "discord.js";
import { Plugin } from "../types";
import { ping } from "./commands/ping";

export const informationPlugin: Plugin = {
  name: "information",
  description: "Information and utility commands",
  commands: [ping],
  events: [],
  load: async (client: Client) => {
    console.log("Information plugin loaded - providing utility commands");
  }
};
