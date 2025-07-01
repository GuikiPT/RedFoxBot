import { SubcommandHandler } from '../../../types';
import { configSubcommand } from './config';
import { forceSendSubcommand } from './forceSend';
import { enabledSubcommand } from './enabled';

export const subcommands: Map<string, SubcommandHandler> = new Map([
  [configSubcommand.name, configSubcommand],
  [forceSendSubcommand.name, forceSendSubcommand],
  [enabledSubcommand.name, enabledSubcommand],
]);

export * from './types';
export { configSubcommand } from './config';
export { forceSendSubcommand } from './forceSend';
export { enabledSubcommand } from './enabled';
