import { config } from "./config/config";
import { RedFoxClient } from "./redfoxClient";
import "./logger";
import { handleError } from "./utils/errorHandler";
import { initDatabases } from "./db";
import { registerShutdownHandlers } from "./utils/shutdown";

const client = new RedFoxClient({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

// Initialize bot
async function initializeBot() {
  try {
    console.log("🚀 Launching RedFoxBot, hang tight...");

    // Initialize databases
    await initDatabases();
    
    // Load all plugins
    await client.pluginLoader.loadAllPlugins();
    
    // Login to Discord
    await client.login(config.DISCORD_TOKEN);
    
  } catch (error) {
    handleError(error, "❌ Failed to initialize bot");
    process.exit(1);
  }
}

// Graceful shutdown
registerShutdownHandlers(client, client.pluginLoader);

process.on("unhandledRejection", (reason) => {
  handleError(reason, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  handleError(err, "Uncaught exception");
});

initializeBot();
