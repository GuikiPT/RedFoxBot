import dotenv from "dotenv";

dotenv.config();

interface Config {
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  BOT_OWNER_IDS: string[];
  OWNER_GUILD_IDS?: string[];
  LOG_TO_FILE: boolean;
  LAVALINK_HOST: string;
  LAVALINK_PORT: string;
  LAVALINK_PASSWORD: string;
  LAVALINK_SECURE: boolean;
}

function validateConfig(): Config {
  const { DISCORD_TOKEN, DISCORD_CLIENT_ID, BOT_OWNER_IDS, OWNER_GUILD_IDS, LOG_TO_FILE,
    LAVALINK_HOST, LAVALINK_PORT, LAVALINK_PASSWORD, LAVALINK_SECURE } = process.env;
  
  const requiredVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'LAVALINK_HOST', 'LAVALINK_PORT', 'LAVALINK_PASSWORD'] as const;
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  return {
    DISCORD_TOKEN: DISCORD_TOKEN!,
    DISCORD_CLIENT_ID: DISCORD_CLIENT_ID!,
    BOT_OWNER_IDS: BOT_OWNER_IDS ? BOT_OWNER_IDS.split(',') : [],
    OWNER_GUILD_IDS: OWNER_GUILD_IDS ? OWNER_GUILD_IDS.split(',') : undefined,
    LOG_TO_FILE: LOG_TO_FILE === 'true',
    LAVALINK_HOST: LAVALINK_HOST!,
    LAVALINK_PORT: LAVALINK_PORT!,
    LAVALINK_PASSWORD: LAVALINK_PASSWORD!,
    LAVALINK_SECURE: LAVALINK_SECURE === 'true',
  };
}

export const config = validateConfig();
