require("dotenv").config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  logging: false,
  port: process.env.PORT || 8080,
  mongodbUri: process.env.MONGODB_URI,
  nodes: [
    {
      host: "lavalink.serenetia.com",
      password: "https://dsc.gg/ajidevserver",
      port: 80,
      secure: false,
    },
    {
      host: "lavalinkv4-id.serenetia.com",
      password: "https://dsc.gg/ajidevserver",
      port: 80,
      secure: false,
    },
    {
      password: "youshallnotpass",
      host: "vip.visionhost.cloud",
      port: 7023,
      secure: false,
    },
  ],
};
