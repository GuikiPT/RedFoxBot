import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const stop: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and leave"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session) {
      await interaction.reply({ content: "Nothing is playing", ephemeral: true });
      return;
    }
    const shoukaku = (interaction.client as any).shoukaku;
    if (shoukaku) {
      await shoukaku.leaveVoiceChannel(interaction.guild!.id);
    }
    sessions.delete(interaction.guild!.id);
    await interaction.reply({ content: "Stopped", ephemeral: true });
  }
};
