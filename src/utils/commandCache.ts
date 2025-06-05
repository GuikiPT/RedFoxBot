import fs from 'fs';
import path from 'path';
import { handleError } from './errorHandler';

const cachePath = path.join(__dirname, '..', '..', 'commandCache.json');

type CommandCache = Record<string, string>;

function readCache(): CommandCache {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as CommandCache;
    }
  } catch (error) {
    handleError(error, 'readCommandCache');
  }
  return {};
}

function writeCache(cache: CommandCache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    handleError(error, 'writeCommandCache');
  }
}

export function commandsChanged(scope: string, commands: any[]): boolean {
  const cache = readCache();
  const serialized = JSON.stringify(commands);
  if (cache[scope] !== serialized) {
    cache[scope] = serialized;
    writeCache(cache);
    return true;
  }
  return false;
}
