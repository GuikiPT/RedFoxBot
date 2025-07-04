import { SubcommandHandler } from '../../../types';

import { reminder } from './reminder';
import { listReminders } from './listReminders';
import { deleteReminder } from './deleteReminder';

export const subcommands: SubcommandHandler[] = [
  reminder,
  listReminders,
  deleteReminder,
];
