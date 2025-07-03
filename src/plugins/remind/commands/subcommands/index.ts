import { ChatInputCommandInteraction } from 'discord.js';

export interface SubcommandHandler {
  name: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

import { reminder } from './reminder';
import { listReminders } from './listReminders';
import { deleteReminder } from './deleteReminder';

export const subcommands: SubcommandHandler[] = [
  reminder,
  listReminders,
  deleteReminder,
];
