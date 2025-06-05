import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session) {
      await interaction.reply({ content: "Nothing is playing", ephemeral: true });
      return;
    }
    await session.player.stopTrack();
    await interaction.reply({ content: "Skipped", ephemeral: true });
  }
};
