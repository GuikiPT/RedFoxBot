import { SubcommandHandler } from './types';
import { lookupSubcommand } from './lookup';
import { subscribeSubcommand } from './subscribe';
import { unsubscribeSubcommand } from './unsubscribe';
import { listSubcommand } from './list';
import { setRoleSubcommand } from './setRole';
import { forceSendLastVideoSubcommand } from './forceSendLastVideo';
import { forceSendVideoSubcommand } from './forceSendVideo';

export const subcommands: Map<string, SubcommandHandler> = new Map([
  [lookupSubcommand.name, lookupSubcommand],
  [subscribeSubcommand.name, subscribeSubcommand],
  [unsubscribeSubcommand.name, unsubscribeSubcommand],
  [listSubcommand.name, listSubcommand],
  [setRoleSubcommand.name, setRoleSubcommand],
  [forceSendLastVideoSubcommand.name, forceSendLastVideoSubcommand],
  [forceSendVideoSubcommand.name, forceSendVideoSubcommand],
]);

export * from './types';
export { lookupSubcommand } from './lookup';
export { subscribeSubcommand } from './subscribe';
export { unsubscribeSubcommand } from './unsubscribe';
export { listSubcommand } from './list';
export { setRoleSubcommand } from './setRole';
export { forceSendLastVideoSubcommand } from './forceSendLastVideo';
export { forceSendVideoSubcommand } from './forceSendVideo';
