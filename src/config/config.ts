import dotenv from "dotenv";

dotenv.config();

interface Config {
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
}

function validateConfig(): Config {
  const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;
  
  const requiredVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'] as const;
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
  };
}

export const config = validateConfig();
