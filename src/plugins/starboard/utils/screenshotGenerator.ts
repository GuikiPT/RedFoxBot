import { AttachmentBuilder, Message } from 'discord.js';
import { chromium, Browser, Page } from 'playwright';
import { config } from '../../../config/config';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a screenshot of a Discord message using Playwright
 * @param message - The Discord message object
 * @returns Promise<AttachmentBuilder | null> - The screenshot as an attachment or null if failed
 */
export async function generateMessageScreenshot(
  message: Message
): Promise<AttachmentBuilder | null>;

/**
 * Generates a screenshot of a Discord message using Playwright with message IDs
 * @param guildId - The guild ID where the message is located
 * @param channelId - The channel ID where the message is located
 * @param messageId - The message ID to screenshot
 * @returns Promise<AttachmentBuilder | null> - The screenshot as an attachment or null if failed
 */
export async function generateMessageScreenshot(
  guildId: string,
  channelId: string,
  messageId: string
): Promise<AttachmentBuilder | null>;

export async function generateMessageScreenshot(
  messageOrGuildId: Message | string,
  channelId?: string,
  messageId?: string
): Promise<AttachmentBuilder | null> {
  let guildId: string;
  let targetChannelId: string;
  let targetMessageId: string;
  let message: Message | null = null;

  // Handle different parameter combinations
  if (typeof messageOrGuildId === 'string') {
    // Called with IDs
    guildId = messageOrGuildId;
    targetChannelId = channelId!;
    targetMessageId = messageId!;
  } else {
    // Called with Message object
    message = messageOrGuildId;
    guildId = message.guildId!;
    targetChannelId = message.channelId;
    targetMessageId = message.id;
  }

  if (!config.STARBOARD_SCREENSHOTS_ENABLED) {
    console.log('📷 Screenshot generation is disabled via configuration');
    return null;
  }

  let browser: Browser | null = null;
  try {
    console.log(`🖼️ Generating screenshot for message ${targetMessageId} in ${guildId}/${targetChannelId}`);

    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for consistent screenshots - adjust size based on content
    // await page.setViewportSize({ width: 1000, height: 600 });

    // Prioritize API endpoint if configured, otherwise fall back to local HTML rendering
    if (config.STARBOARD_API_ENDPOINT) {
      // Use API endpoint when available (preferred when API is configured)
      const messageUrl = `${config.STARBOARD_API_ENDPOINT}/${guildId}/${targetChannelId}/${targetMessageId}`;
      
      console.log(`🌐 Using API endpoint for message ${targetMessageId}: ${messageUrl}`);
      
      await page.goto(messageUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
    } else if (message) {
      // Fall back to local HTML rendering if no API endpoint is configured
      console.log(`📝 Using local HTML rendering for message ${targetMessageId} (no API endpoint configured)`);
      const html = await generateMessageHTML(message);
      await page.setContent(html, { waitUntil: 'networkidle' });
      
      // Wait for images to load completely
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete && img.naturalHeight !== 0);
      }, { timeout: 10000 }).catch(() => {
        console.warn('⚠️ Timeout waiting for images to load, proceeding with screenshot');
      });
    } else {
      throw new Error('No API endpoint configured and no message object provided');
    }

    // Remove zoom to avoid quality issues and ensure full content capture
    // await page.evaluate(() => {
    //   document.body.style.zoom = '2';
    // });

    // Wait for content to load and layout to stabilize
    await page.waitForTimeout(1500);

    // Try to find the message container
    let element = page.locator('div#discord-message-container');
    
    // If not found, try common Discord message selectors
    if (await element.count() === 0) {
      element = page.locator('[data-message-id]').first();
    }
    
    // If still not found, capture the entire body
    if (await element.count() === 0) {
      element = page.locator('body');
      console.warn('⚠️ Discord message container not found, capturing entire page');
    }

    // Get the element's bounding box to ensure proper sizing
    const boundingBox = await element.boundingBox();
    if (boundingBox) {
      console.log(`📏 Element dimensions: ${boundingBox.width}x${boundingBox.height}`);
    }

    // Take screenshot with optimized settings
    const imageBuffer = await element.screenshot({
      type: 'png',
      animations: 'disabled', // Disable animations for consistent screenshots
    });

    console.log(`✅ Screenshot generated successfully (${imageBuffer.length} bytes)`);

    return new AttachmentBuilder(imageBuffer, {
      name: `message_screenshot.png`,
    });

  } catch (error) {
    console.error('❌ Error generating message screenshot:', error);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}

/**
 * Generates HTML for a Discord message for screenshot purposes
 * @param message - The Discord message
 * @returns Promise<string> - The HTML representation
 */
async function generateMessageHTML(message: Message): Promise<string> {
  const authorAvatarUrl = message.author?.displayAvatarURL({ size: 64 }) || '';
  const authorName = message.author?.displayName || message.author?.username || 'Unknown User';
  const messageContent = message.content || '*No text content*';
  const timestamp = message.createdAt.toLocaleString();

  // Get attachment URLs if any
  const attachments = Array.from(message.attachments.values()).map(att => ({
    url: att.url,
    name: att.name,
    contentType: att.contentType
  }));

  const imageAttachments = attachments.filter(att => att.contentType?.startsWith('image/'));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Discord Message Screenshot</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #36393f;
                color: #dcddde;
                padding: 0;
                margin: 0;
                width: 100%;
                min-height: 100vh;
                overflow: visible;
            }
            
            .message-container {
                background-color: #40444b;
                border-radius: 8px;
                padding: 20px;
                width: 100%;
                max-width: none;
                margin: 0;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                position: relative;
                min-height: fit-content;
                overflow: visible;
            }
            
            .message-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 12px;
                background-color: #7289da;
            }
            
            .author-info {
                display: flex;
                flex-direction: column;
            }
            
            .author-name {
                font-weight: 600;
                color: #ffffff;
                font-size: 16px;
            }
            
            .timestamp {
                font-size: 12px;
                color: #72767d;
            }
            
            .message-content {
                margin-left: 52px;
                line-height: 1.375;
                font-size: 14px;
                word-wrap: break-word;
            }
            
            .attachment {
                margin-top: 12px;
                border-radius: 8px;
                overflow: hidden;
                max-width: 100%;
            }
            
            .attachment img {
                max-width: 100%;
                height: auto;
                display: block;
            }
            
            .starboard-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                background-color: #ffd700;
                color: #000;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div id="discord-message-container" class="message-container">
            <div class="starboard-indicator">⭐ Starboard</div>
            <div class="message-header">
                <img src="${authorAvatarUrl}" alt="${authorName}" class="avatar" onerror="this.style.display='none'">
                <div class="author-info">
                    <span class="author-name">${authorName}</span>
                    <span class="timestamp">${timestamp}</span>
                </div>
            </div>
            <div class="message-content">
                ${messageContent.replace(/\n/g, '<br>')}
            </div>
            ${imageAttachments.map(att => `
                <div class="attachment">
                    <img src="${att.url}" alt="${att.name}" loading="lazy">
                </div>
            `).join('')}
        </div>
    </body>
    </html>
  `;
}

/**
 * Creates a fallback embed when screenshot generation fails
 * @param content - The message content
 * @param author - The message author information
 * @param messageUrl - The Discord message URL
 * @param reactionCount - The number of reactions
 * @param emoji - The starboard emoji
 * @returns An embed builder with fallback content
 */
export function createFallbackEmbed(
  content: string,
  author: { username: string; displayName?: string; avatarURL: string; id: string },
  messageUrl: string,
  reactionCount: number,
  emoji: string
) {
  return {
    color: 0xffd700, // Gold color
    title: `${emoji} ${reactionCount} | ${author.displayName || author.username}`,
    description: content || '*No text content*',
    author: {
      name: author.displayName || author.username,
      icon_url: author.avatarURL,
    },
    fields: [
      {
        name: 'Author',
        value: `<@${author.id}>`,
        inline: true,
      },
      {
        name: 'Message Link',
        value: `[Jump to message](${messageUrl})`,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}
