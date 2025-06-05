import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../../types";

export const hello: Command = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Say hello to someone!")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to greet")
        .setRequired(false)
    ),
    
  execute: async (interaction: CommandInteraction) => {
    const user = interaction.options.get("user")?.user || interaction.user;
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle("👋 Hello!")
      .setDescription(`Hello ${user}! Hope you're having a great day! 🌟`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
