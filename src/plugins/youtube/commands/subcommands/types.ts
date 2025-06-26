import { ChatInputCommandInteraction } from 'discord.js';

export interface SubcommandHandler {
  name: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
