import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { StarBoardConfig } from '../../../../db/models/StarBoardConfig';

export const viewSubcommand: SubcommandHandler = {
  name: 'view',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('This command can only be used in a server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      // Get starboard config for this guild
      const config = await StarBoardConfig.findOne({
        where: { guildId: interaction.guildId },
      });

      if (!config) {
        const embed = new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle('⭐ Starboard Not Configured')
          .setDescription('The starboard has not been configured for this server yet.')
          .addFields({
            name: '🔧 Setup Required',
            value: 'Use `/starboard config` to configure the starboard for this server.',
            inline: false
          })
          .setFooter({ 
            text: `Requested by ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Check if the channel still exists
      let channelStatus = '✅ Available';
      let channelMention = `<#${config.channelId}>`;
      
      try {
        const channel = await interaction.guild?.channels.fetch(config.channelId);
        if (!channel) {
          channelStatus = '❌ Channel Deleted';
          channelMention = `~~#deleted-channel~~ (ID: ${config.channelId})`;
        }
      } catch (error) {
        channelStatus = '❌ Channel Inaccessible';
        channelMention = `~~#inaccessible-channel~~ (ID: ${config.channelId})`;
      }

      const statusIcon = config.enabled ? '🟢' : '🔴';
      const statusText = config.enabled ? 'Enabled' : 'Disabled';
      const statusColor = config.enabled ? 0xffd700 : 0x808080;

      const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle('⭐ Starboard Configuration')
        .setDescription(`Current starboard settings for **${interaction.guild?.name}**`)
        .addFields(
          { 
            name: '📍 Starboard Channel', 
            value: `${channelMention}\n${channelStatus}`, 
            inline: true 
          },
          { 
            name: '⭐ Reaction Emoji', 
            value: config.emoji, 
            inline: true 
          },
          { 
            name: '📊 Reaction Threshold', 
            value: `${config.emojiThreshold} reaction${config.emojiThreshold !== 1 ? 's' : ''}`, 
            inline: true 
          },
          { 
            name: `${statusIcon} Status`, 
            value: statusText, 
            inline: true 
          },
          { 
            name: '🆔 Guild ID', 
            value: `\`${config.guildId}\``, 
            inline: true 
          },
          { 
            name: '📅 Last Updated', 
            value: `<t:${Math.floor(new Date((config as any).updatedAt || Date.now()).getTime() / 1000)}:R>`, 
            inline: true 
          }
        )
        .setFooter({ 
          text: `Requested by ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Add warning if disabled or channel issues
      if (!config.enabled) {
        embed.addFields({
          name: '⚠️ Notice',
          value: 'The starboard is currently **disabled**. Use `/starboard enabled enable` to activate it.',
          inline: false
        });
      } else if (channelStatus.includes('❌')) {
        embed.addFields({
          name: '⚠️ Warning',
          value: 'The starboard channel has issues. Use `/starboard config` to update the configuration.',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error viewing starboard config:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ View Failed')
        .setDescription('Failed to retrieve the starboard configuration. Please try again.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
