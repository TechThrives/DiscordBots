require("dotenv").config();

module.exports = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  botToken: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  embedColor: "#0061ff",
  imageGeneration: {
    apiEndpoint: process.env.IMAGE_API_ENDPOINT,
  },
  server:{
    port: process.env.PORT || 8080,
  },
  aiTextChannels: [
    "1366335565364203551"
  ],
  aiImageChannels: [
    "1366335805383250020"
  ],
};
