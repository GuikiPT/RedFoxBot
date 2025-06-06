import { Client } from 'discord.js';
import { PluginLoader } from '../plugins';

export function registerShutdownHandlers(client: Client, loader: PluginLoader) {
  const shutdown = async () => {
    console.log('\n🛑 Shutting down RedFoxBot...');
    await loader.unloadAllPlugins();
    await client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
