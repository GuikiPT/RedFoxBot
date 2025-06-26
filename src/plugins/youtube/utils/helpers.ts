import { Client, GuildTextBasedChannel, EmbedBuilder } from 'discord.js';
import { resolveYouTubeHandle } from '../../../utils/youtubeHandleResolver';

/**
 * Helper function to detect if input is a channel ID or handle
 * YouTube channel IDs are 24 characters starting with UC
 */
export function isChannelId(input: string): boolean {
  return /^UC[a-zA-Z0-9_-]{22}$/.test(input);
}

/**
 * Helper function to resolve YouTube channel input to channel ID
 * Handles both channel IDs and channel handles/usernames
 */
export async function resolveYouTubeChannelId(channelInput: string): Promise<{ channelId: string | null; error?: string }> {
  if (isChannelId(channelInput)) {
    return { channelId: channelInput };
  }
  
  const result = await resolveYouTubeHandle(channelInput);
  if (!result.channelId) {
    return { 
      channelId: null, 
      error: `Could not resolve YouTube channel: **${channelInput}**\nMake sure it's a valid channel handle (e.g., @username) or channel ID.` 
    };
  }
  
  return { channelId: result.channelId };
}

/**
 * Helper function to format role mentions correctly
 */
export function formatRoleMention(roleId: string, guildId: string): string {
  if (roleId === guildId) {
    // @everyone role
    return '@everyone';
  } else {
    // Regular role
    return `<@&${roleId}>`;
  }
}

/**
 * Helper function to fetch and validate a Discord text channel
 */
export async function fetchTextChannel(client: Client, channelId: string): Promise<GuildTextBasedChannel | null> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      return channel as GuildTextBasedChannel;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper function to create error embeds with consistent styling
 */
export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}
