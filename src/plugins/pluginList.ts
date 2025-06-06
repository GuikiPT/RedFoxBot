import { Plugin } from './types';
import { corePlugin } from './core/corePlugin';
import { informationPlugin } from './information/informationPlugin';
import { ownerPlugin } from './owner/ownerPlugin';
import { youtubePlugin } from './youtube/youtubePlugin';

// Add new plugins to this list so they are loaded by default
export const defaultPlugins: Plugin[] = [
  corePlugin,
  informationPlugin,
  ownerPlugin,
  youtubePlugin,
  // examplePlugin, // Uncomment to enable the example plugin
];
