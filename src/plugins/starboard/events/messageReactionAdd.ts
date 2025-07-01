import {
  Client,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  GuildTextBasedChannel,
  ChannelType,
} from 'discord.js';
import { EventHandler } from '../../types';
import { StarBoardConfig } from '../../../db/models/StarBoardConfig';
import {
  findExistingStarboardRecord,
  findExistingStarboardMessage,
  createStarboardMessagePackage,
  sendToStarboard,
  updateStarboardMessage,
  validateStarboardConfig,
} from '../utils/starboardHelpers';

export const messageReactionAdd: EventHandler = {
  name: 'messageReactionAdd',
  once: false,
  execute: async (
    client: Client,
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) => {
    try {
      // Fetch partial data if needed
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error('Failed to fetch the reaction:', error);
          return;
        }
      }

      if (reaction.message.partial) {
        try {
          await reaction.message.fetch();
        } catch (error) {
          console.error('Failed to fetch the message:', error);
          return;
        }
      }

      // Only process reactions in guilds
      if (!reaction.message.guildId) {
        return;
      }

      // Get starboard configuration for this guild
      const starboardConfig = await StarBoardConfig.findOne({
        where: { 
          guildId: reaction.message.guildId,
          enabled: true 
        },
      });

      if (!validateStarboardConfig(starboardConfig, reaction.message.guildId)) {
        return; // No valid starboard configuration
      }

      // Check if this is the correct emoji and meets threshold
      const isStarboardEmoji = reaction.emoji.name === starboardConfig!.emoji || 
                               reaction.emoji.toString() === starboardConfig!.emoji;
      const meetsReactionThreshold = reaction.count && reaction.count >= starboardConfig!.emojiThreshold;

      if (!isStarboardEmoji || !meetsReactionThreshold) {
        return;
      }

      // Get the starboard channel
      const starboardChannel = await client.channels.fetch(starboardConfig!.channelId);
      if (!starboardChannel || 
          (starboardChannel.type !== ChannelType.GuildText && 
           starboardChannel.type !== ChannelType.GuildAnnouncement)) {
        console.error(`Starboard channel ${starboardConfig!.channelId} not found or not a text channel`);
        return;
      }

      // Get the original message
      const message = reaction.message;
      if (!message.author || !message.guildId) {
        return;
      }

      // Ensure we have a full message object
      const fullMessage = message.partial ? await message.fetch() : message;

      // Don't star messages in the starboard channel itself
      if (fullMessage.channelId === starboardConfig!.channelId) {
        return;
      }

      // Check if this message is already on the starboard using database record
      const existingStarboardRecord = await findExistingStarboardRecord(
        fullMessage.guildId!,
        fullMessage.id
      );

      if (existingStarboardRecord) {
        // Message is already on starboard, just update the reaction count
        const existingStarboardMessage = await findExistingStarboardMessage(
          starboardChannel as GuildTextBasedChannel,
          fullMessage.id
        );

        if (existingStarboardMessage) {
          try {
            await updateStarboardMessage(
              existingStarboardMessage,
              reaction.count!,
              starboardConfig!.emoji,
              fullMessage.author?.displayName || fullMessage.author?.username || 'Unknown User'
            );
            console.log(`⭐ Updated starboard message ${fullMessage.id} with reaction count: ${reaction.count}`);
          } catch (error) {
            console.error('Error updating starboard message:', error);
          }
        }
        return;
      }

      // Only send to starboard if this is the FIRST time it meets the threshold
      // and it hasn't been posted before

      // Create complete starboard message package (embed, buttons, and optional screenshot)
      const messagePackage = await createStarboardMessagePackage(
        fullMessage,
        reaction.count!,
        starboardConfig!.emoji,
        client.user || undefined
      );

      // Send to starboard channel
      try {
        await sendToStarboard(
          starboardChannel as GuildTextBasedChannel,
          fullMessage,
          messagePackage.embed,
          messagePackage.buttons,
          messagePackage.attachment
        );

        console.log(`⭐ Message ${fullMessage.id} added to starboard in guild ${fullMessage.guildId} with ${reaction.count} reactions (FIRST TIME)`);
      } catch (error) {
        console.error('Error sending message to starboard:', error);
        
        // If there was an error sending, make sure we don't have a dangling database record
        try {
          const recordToCleanup = await findExistingStarboardRecord(fullMessage.guildId!, fullMessage.id);
          if (recordToCleanup) {
            await recordToCleanup.destroy();
            console.log(`🧹 Cleaned up failed starboard record for message ${fullMessage.id}`);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up failed starboard record:', cleanupError);
        }
      }

    } catch (error) {
      console.error('Error in messageReactionAdd starboard handler:', error);
    }
  },
};
