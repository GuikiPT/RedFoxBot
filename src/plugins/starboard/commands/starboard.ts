import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { subcommands } from './subcommands';

export const starboard: Command = {
    data: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Manage starboard settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub
                .setName('config')
                .setDescription('Configure the starboard')
                .addChannelOption(o =>
                    o
                        .setName('channel')
                        .setDescription('Channel where starred messages will be sent')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o
                        .setName('emoji')
                        .setDescription('Emoji to use for starring messages')
                        .setRequired(true)
                )
                .addIntegerOption(o =>
                    o
                        .setName('threshold')
                        .setDescription('Number of reactions needed to star a message (default: 3)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('view')
                .setDescription('View current starboard configuration')
        )
        .addSubcommand(sub =>
            sub
                .setName('force-send')
                .setDescription('Force send a message to the starboard')
                .addStringOption(o =>
                    o
                        .setName('message')
                        .setDescription('Message URL or ID to send to starboard')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('enabled')
                .setDescription('Enable or disable the starboard')
                .addStringOption(o =>
                    o
                        .setName('action')
                        .setDescription('Enable or disable the starboard')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' }
                        )
                )
        ) as SlashCommandBuilder,
    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();
        
        try {
            // All subcommands require guild context
            if (!interaction.guildId) {
                await interaction.reply({
                    content: 'This command can only be used in a server.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            // Execute the appropriate subcommand
            const subcommandHandler = subcommands.get(sub);
            if (subcommandHandler) {
                await subcommandHandler.execute(interaction);
            } else {
                await interaction.reply({
                    content: 'Unknown subcommand.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (err) {
            console.error('Starboard command failed:', err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Command failed.', flags: MessageFlags.Ephemeral });
            } else if (interaction.deferred) {
                await interaction.editReply({ content: 'Command failed.' });
            }
        }
    },
}
