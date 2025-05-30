require("dotenv").config();

module.exports = {
  TOKEN: process.env.TOKEN || "",
  language: "en",
  mongodbUri: process.env.MONGODB_URI || "",
  spotifyClientId: "a568b55af1d940aca52ea8fe02f0d93b",
  spotifyClientSecret: "e8199f4024fe49c5b22ea9a3dd0c4789",
  commandsDir: "./commands",
  embedColor: "#1db954",
  activityName: "YouTube Music",
  activityType: "Listening",
  embedTimeout: 5,
  errorLog: "",
  port: process.env.PORT || 8080,
  nodes: [
    {
      host: "lavalink.jirayu.net",
      password: "youshallnotpass",
      port: 13592,
      secure: false,
    },
  ],
};
