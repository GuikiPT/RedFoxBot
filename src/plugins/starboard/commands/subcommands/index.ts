import { SubcommandHandler } from '../../../types';
import { configSubcommand } from './config';
import { forceSendSubcommand } from './forceSend';
import { enabledSubcommand } from './enabled';
import { viewSubcommand } from './view';

export const subcommands: Map<string, SubcommandHandler> = new Map([
  [configSubcommand.name, configSubcommand],
  [forceSendSubcommand.name, forceSendSubcommand],
  [enabledSubcommand.name, enabledSubcommand],
  [viewSubcommand.name, viewSubcommand],
]);

export * from './types';
export { configSubcommand } from './config';
export { forceSendSubcommand } from './forceSend';
export { enabledSubcommand } from './enabled';
export { viewSubcommand } from './view';
