import { Client } from "discord.js";
import { Plugin } from "./types";
import { DefaultPluginManager } from "./pluginManager";
import { corePlugin } from "./core/corePlugin";
import { informationPlugin } from "./information/informationPlugin";
// import { examplePlugin } from "./example/examplePlugin";

export class PluginLoader {
  private pluginManager: DefaultPluginManager;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.pluginManager = new DefaultPluginManager();
    // Attach plugin manager to client for easy access
    (client as any).pluginManager = this.pluginManager;
  }

  async loadAllPlugins(): Promise<void> {
    const plugins = [
      corePlugin,
      informationPlugin,
      // examplePlugin, // Uncomment to enable the example plugin
    ];

    console.log("🔌 Loading plugins...");
    
    for (const plugin of plugins) {
      try {
        await this.pluginManager.loadPlugin(plugin, this.client);
      } catch (error) {
        console.error(`❌ Failed to load plugin ${plugin.name}:`, error);
      }
    }

    console.log(`✅ Loaded ${this.pluginManager.plugins.size} plugins successfully`);
  }

  async unloadAllPlugins(): Promise<void> {
    console.log("🔌 Unloading plugins...");
    
    const pluginNames = Array.from(this.pluginManager.plugins.keys());
    
    for (const pluginName of pluginNames) {
      try {
        await this.pluginManager.unloadPlugin(pluginName, this.client);
      } catch (error) {
        console.error(`❌ Failed to unload plugin ${pluginName}:`, error);
      }
    }

    console.log("✅ All plugins unloaded");
  }

  getPluginManager(): DefaultPluginManager {
    return this.pluginManager;
  }
}
