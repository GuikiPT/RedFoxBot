require('dotenv/config');
const {
  Client,
  GatewayIntentBits,
  MessageFlags,
  TextDisplayBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', (client) => {
  console.log(`${client.user.username} is online and ready to test Components v2!`);
});

client.on('messageCreate', async (message) => {
  if (message.content === 'test-youtube') {
    const textComponent = new TextDisplayBuilder().setContent(
      '# ✅ YouTube Channel Found\n\n**Input:** @examplechannel\n**Channel ID:** UCexample123\n**Method:** handle_resolution\n**Channel Name:** Example Channel\n**Videos Found:** 42'
    );

    const containerComponent = new ContainerBuilder()
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
      )
      .addTextDisplayComponents(textComponent)
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    message.channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent],
    });
  }
});

if (process.env.TOKEN) {
  client.login(process.env.TOKEN);
} else {
  console.log('No TOKEN found in environment variables. Please set TOKEN in your .env file.');
}
