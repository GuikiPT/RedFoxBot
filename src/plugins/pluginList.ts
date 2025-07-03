import { Plugin } from './types';
import { corePlugin } from './core/corePlugin';
import { informationPlugin } from './information/informationPlugin';
import { ownerPlugin } from './owner/ownerPlugin';
import { youtubePlugin } from './youtube/youtubePlugin';
import { starboardPlugin } from './starboard/starboardPlugin';
import { remindPlugin } from './remind/remindPlugin';

// Add new plugins to this list so they are loaded by default
export const defaultPlugins: Plugin[] = [
  corePlugin,
  informationPlugin,
  ownerPlugin,
  youtubePlugin,
  starboardPlugin,
  remindPlugin,
  // examplePlugin, // Uncomment to enable the example plugin
];
