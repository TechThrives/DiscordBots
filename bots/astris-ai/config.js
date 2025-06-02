require("dotenv").config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  logging: false,
  geminiKey: process.env.GEMINI_KEY,
  imageEndpoint: process.env.IMAGE_ENDPOINT,
  googleImageFxEndpoint: process.env.GOOGLE_IMAGE_FX_ENDPOINT,
  googleImageFxKey: process.env.GOOGLE_IMAGE_FX_KEY,
  port: process.env.PORT || 8080,
  mongodbUri: process.env.MONGODB_URI,
};
