import {
  GuildTextBasedChannel,
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { StarBoardConfig } from '../../../db/models/StarBoardConfig';
import { StarBoardMessage } from '../../../db/models/StarBoardMessage';
import { config } from '../../../config/config';

/**
 * Checks if a message is already on the starboard using database tracking
 * @param guildId - The guild ID
 * @param messageId - The original message ID
 * @returns Promise<StarBoardMessage | null> - The starboard message record if found, null otherwise
 */
export async function findExistingStarboardRecord(
  guildId: string,
  messageId: string
): Promise<StarBoardMessage | null> {
  try {
    return await StarBoardMessage.findOne({
      where: {
        guildId,
        originalMessageId: messageId
      }
    });
  } catch (error) {
    console.error('Error finding existing starboard record:', error);
    return null;
  }
}

/**
 * Checks if a message is already on the starboard by fetching the actual Discord message
 * @param starboardChannel - The starboard channel
 * @param messageId - The original message ID
 * @returns Promise<Message | null> - The starboard message if found, null otherwise
 */
export async function findExistingStarboardMessage(
  starboardChannel: GuildTextBasedChannel,
  messageId: string
): Promise<Message | null> {
  try {
    // First check database record
    const record = await findExistingStarboardRecord(starboardChannel.guildId, messageId);
    if (!record) {
      return null;
    }

    // Try to fetch the actual Discord message
    try {
      return await starboardChannel.messages.fetch(record.starboardMessageId);
    } catch (error) {
      // Message was deleted, clean up database record
      console.warn(`Starboard message ${record.starboardMessageId} not found, removing database record`);
      await record.destroy();
      return null;
    }
  } catch (error) {
    console.error('Error finding existing starboard message:', error);
    return null;
  }
}

/**
 * Creates a starboard embed for a message
 * @param message - The original message
 * @param reactionCount - The number of reactions
 * @param emoji - The starboard emoji
 * @param clientUser - The bot user for footer
 * @param hasScreenshot - Whether a screenshot attachment is being sent with this embed
 * @returns EmbedBuilder - The starboard embed
 */
export function createStarboardEmbed(
  message: Message,
  reactionCount: number,
  emoji: string,
  clientUser?: { displayAvatarURL(): string },
  hasScreenshot?: boolean
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0xffd700) // Gold color for starboard
    .setAuthor({
      name: message.author?.displayName || message.author?.username || 'Unknown User',
      iconURL: message.author?.displayAvatarURL(),
    })
    .addFields(
      { 
        name: '📍 Channel', 
        value: `<#${message.channelId}>`, 
        inline: true 
      },
      { 
        name: '⏰ Posted', 
        value: `<t:${Math.floor(message.createdTimestamp / 1000)}:R>`, 
        inline: true 
      },
      { 
        name: '🔗 Link', 
        value: `[Jump to message](${message.url})`, 
        inline: true 
      }
    )
    .setFooter({ 
      text: `${emoji} ${reactionCount} reactions | Message ID: ${message.id}`,
      iconURL: clientUser?.displayAvatarURL()
    })
    .setTimestamp();

  // Only add description if there's actual content
//   if (message.content && message.content.trim()) {
//     embed.setDescription(message.content);
//   }

  // Prioritize screenshot if provided, otherwise use message attachments
  if (hasScreenshot) {
    embed.setImage('attachment://message_screenshot.png');
  } else if (message.attachments.size > 0) {
    const imageAttachment = message.attachments.find(att => 
      att.contentType?.startsWith('image/')
    );
    if (imageAttachment) {
      embed.setImage(imageAttachment.url);
    }
  }

  return embed;
}

/**
 * Creates action buttons for the starboard message
 * @param message - The original message
 * @returns ActionRowBuilder<ButtonBuilder> - The action row with buttons
 */
export function createStarboardButtons(message: Message): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Jump to Message')
        .setStyle(ButtonStyle.Link)
        .setURL(message.url)
    );
}

/**
 * Sends a message to the starboard channel and creates a database record
 * @param starboardChannel - The starboard channel
 * @param originalMessage - The original message being starred
 * @param embed - The embed to send
 * @param buttons - The action buttons
 * @param attachment - Optional attachment (e.g., screenshot)
 * @returns Promise<Message> - The sent starboard message
 */
export async function sendToStarboard(
  starboardChannel: GuildTextBasedChannel,
  originalMessage: Message,
  embed: EmbedBuilder,
  buttons: ActionRowBuilder<ButtonBuilder>,
  attachment?: AttachmentBuilder
): Promise<Message> {
  const messageOptions: any = {
    embeds: [embed],
    components: [buttons],
  };

  if (attachment) {
    messageOptions.files = [attachment];
  }

  // Send the message to starboard
  const starboardMessage = await starboardChannel.send(messageOptions);

  // Create database record to track this starboard message
  try {
    await StarBoardMessage.create({
      guildId: starboardChannel.guildId,
      originalMessageId: originalMessage.id,
      starboardMessageId: starboardMessage.id,
      channelId: originalMessage.channelId,
      starboardChannelId: starboardChannel.id,
    });
    console.log(`📝 Created starboard record for message ${originalMessage.id} -> ${starboardMessage.id}`);
  } catch (error) {
    console.error('Error creating starboard database record:', error);
    // Don't fail the operation if database record creation fails
  }

  return starboardMessage;
}

/**
 * Updates an existing starboard message with new reaction count
 * @param starboardMessage - The existing starboard message
 * @param newReactionCount - The new reaction count
 * @param emoji - The starboard emoji
 * @param authorName - The original message author name
 * @returns Promise<Message> - The updated message
 */
export async function updateStarboardMessage(
  starboardMessage: Message,
  newReactionCount: number,
  emoji: string,
  authorName: string
): Promise<Message> {
  if (starboardMessage.embeds.length === 0) {
    throw new Error('Starboard message has no embeds to update');
  }

  const originalEmbed = starboardMessage.embeds[0];
  const currentFooter = originalEmbed.footer;
  
  // Extract the message ID from the current footer and update the reaction count
  const messageIdMatch = currentFooter?.text?.match(/Message ID: (\d+)/);
  const messageId = messageIdMatch ? messageIdMatch[1] : '';
  
  const embed = EmbedBuilder.from(originalEmbed)
    .setFooter({ 
      text: `${emoji} ${newReactionCount} reactions | Message ID: ${messageId}`,
      iconURL: currentFooter?.iconURL
    });
  
  return await starboardMessage.edit({ embeds: [embed] });
}

/**
 * Validates if a starboard configuration is properly set up
 * @param config - The starboard configuration
 * @param guildId - The guild ID to validate against
 * @returns boolean - True if valid, false otherwise
 */
export function validateStarboardConfig(config: StarBoardConfig | null, guildId: string): boolean {
  return !!(
    config &&
    config.enabled &&
    config.guildId === guildId &&
    config.channelId &&
    config.emoji &&
    config.emojiThreshold > 0
  );
}

/**
 * Generates a screenshot attachment for a starboard message
 * @param message - The original Discord message
 * @returns Promise<AttachmentBuilder | null> - The screenshot attachment or null if failed/disabled
 */
export async function generateStarboardScreenshot(
  message: Message
): Promise<AttachmentBuilder | null> {
  // Check if screenshots are enabled
  if (!config.STARBOARD_SCREENSHOTS_ENABLED) {
    console.log('📷 Screenshot generation is disabled via configuration');
    return null;
  }

  try {
    console.log(`🖼️ Generating screenshot for starboard message ${message.id}`);
    
    // Dynamic import to avoid build warnings
    const { generateMessageScreenshot } = await import('./screenshotGenerator');
    const screenshot = await generateMessageScreenshot(message);
    
    if (screenshot) {
      console.log(`✅ Screenshot generated successfully for message ${message.id}`);
      return screenshot;
    } else {
      console.warn(`⚠️ Screenshot generation failed for message ${message.id}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating screenshot for message ${message.id}:`, error);
    return null;
  }
}

/**
 * Creates a complete starboard message package with embed, buttons, and optional screenshot
 * @param message - The original message
 * @param reactionCount - The number of reactions
 * @param emoji - The starboard emoji
 * @param clientUser - The bot user for footer
 * @returns Promise<{embed: EmbedBuilder, buttons: ActionRowBuilder<ButtonBuilder>, attachment?: AttachmentBuilder}> - The complete message package
 */
export async function createStarboardMessagePackage(
  message: Message,
  reactionCount: number,
  emoji: string,
  clientUser?: { displayAvatarURL(): string }
): Promise<{
  embed: EmbedBuilder;
  buttons: ActionRowBuilder<ButtonBuilder>;
  attachment?: AttachmentBuilder;
}> {
  // Generate screenshot if enabled
  const attachment = await generateStarboardScreenshot(message);

  // Update attachment name to match what we reference in the embed
  if (attachment) {
    attachment.setName('message_screenshot.png');
  }

  // Create embed and buttons
  const embed = createStarboardEmbed(message, reactionCount, emoji, clientUser, !!attachment);
  const buttons = createStarboardButtons(message);

  return {
    embed,
    buttons,
    attachment: attachment || undefined,
  };
}
