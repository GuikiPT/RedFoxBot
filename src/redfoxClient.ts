import { Client, ClientOptions } from 'discord.js';
import { PluginLoader } from './plugins';
import { DefaultPluginManager } from './plugins/pluginManager';

export class RedFoxClient extends Client {
  public pluginLoader: PluginLoader;
  public pluginManager: DefaultPluginManager;

  constructor(options: ClientOptions) {
    super(options);
    this.pluginLoader = new PluginLoader(this);
    this.pluginManager = this.pluginLoader.getPluginManager();
  }
}
