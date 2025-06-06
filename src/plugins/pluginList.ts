import { Plugin } from './types';
import { corePlugin } from './core/corePlugin';
import { informationPlugin } from './information/informationPlugin';
import { ownerPlugin } from './owner/ownerPlugin';

// Add new plugins to this list so they are loaded by default
export const defaultPlugins: Plugin[] = [
  corePlugin,
  informationPlugin,
  ownerPlugin,
  // examplePlugin, // Uncomment to enable the example plugin
];
