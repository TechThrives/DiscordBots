require("dotenv").config();

module.exports = {
  nodes: [
    {
      host: "lavalink.jirayu.net",
      password: "youshallnotpass",
      port: 13592,
      secure: false,
    },
  ],
  spotify: {
    clientId: "a568b55af1d940aca52ea8fe02f0d93b",
    clientSecret: "e8199f4024fe49c5b22ea9a3dd0c4789",
  },
  botToken: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  embedColor: "#0061ff",
  botSettings: {
    commandsChannelId: process.env.COMMANDS_CHANNEL_ID,
    voiceChannelId: process.env.VOICE_CHANNEL_ID,
  },
};
