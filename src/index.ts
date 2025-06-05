import { Client } from "discord.js";
import { config } from "./config/config";
import { PluginLoader } from "./plugins";
import "./logger";
import { handleError } from "./utils/errorHandler";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

// Initialize plugin loader
const pluginLoader = new PluginLoader(client);
// Attach plugin loader to client for access in commands
(client as any).pluginLoader = pluginLoader;

// Initialize bot
async function initializeBot() {
  try {
    console.log("🚀 Launching RedFoxBot, hang tight...");
    
    // Load all plugins
    await pluginLoader.loadAllPlugins();
    
    // Login to Discord
    await client.login(config.DISCORD_TOKEN);
    
  } catch (error) {
    handleError(error, "❌ Failed to initialize bot");
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down RedFoxBot...");
  await pluginLoader.unloadAllPlugins();
  await client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down RedFoxBot...");
  await pluginLoader.unloadAllPlugins();
  await client.destroy();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  handleError(reason, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  handleError(err, "Uncaught exception");
});

initializeBot();
