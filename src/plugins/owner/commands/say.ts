import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { isBotOwner } from '../../../utils/auth';

export const say: Command = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say what you write')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want the bot to say')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            if (!isBotOwner(interaction.user.id)) {
                await interaction.reply({ content: 'Only bot owners can use this command.', ephemeral: true });
                return;
            }

            const message = interaction.options.getString('message', true);

            // Send the actual message to the channel
            const channel = interaction.channel;
            if (!channel || !channel.isTextBased() || !('send' in channel)) {
                await interaction.reply({ content: 'Failed to send message: Invalid channel.', ephemeral: true });
                return;
            }

            await channel.send(message);

            // Reply to acknowledge the command (ephemeral so only the owner sees it)
            await interaction.reply({ content: 'Message sent!', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Say command failed:', error);
            await interaction.reply({ content: 'Failed to send message.', ephemeral: true });
        }
    }
};
