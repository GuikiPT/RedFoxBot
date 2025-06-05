import { Client, CommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export interface EventHandler {
  name: string;
  once?: boolean;
  execute: (client: Client, ...args: any[]) => Promise<void> | void;
}

export interface Plugin {
  name: string;
  description: string;
  commands: Command[];
  events: EventHandler[];
  load: (client: Client) => Promise<void> | void;
  unload?: (client: Client) => Promise<void> | void;
}

export interface PluginManager {
  plugins: Map<string, Plugin>;
  loadPlugin: (plugin: Plugin, client: Client) => Promise<void>;
  unloadPlugin: (pluginName: string, client: Client) => Promise<void>;
  getAllCommands: () => Command[];
  getCommand: (commandName: string) => Command | undefined;
}
