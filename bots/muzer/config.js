require("dotenv").config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  logging: false,
  port: process.env.PORT || 8080,
  mongodbUri: process.env.MONGODB_URI,
  nodes: [
    {
      host: "lavalink.jirayu.net",
      password: "youshallnotpass",
      port: 13592,
      secure: false,
    },
    {
      host: "lavalink.beban.tech",
      port: 80,
      password: "bytebee_",
      secure: false,
    },
  ],
};
