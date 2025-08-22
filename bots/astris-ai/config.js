require("dotenv").config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  logging: false,
  geminiKey: process.env.GEMINI_KEY,
  imageEndpoint: process.env.IMAGE_ENDPOINT,
  googleImageFxEndpoint: process.env.GOOGLE_IMAGE_FX_ENDPOINT,
  port: process.env.PORT || 8080,
  mongodbUri: process.env.MONGODB_URI,
  ignorePrefix: "!",
  infipImageFxEndpoint: process.env.INFIP_IMAGE_FX_ENDPOINT,
  infipKey: process.env.INFIP_KEY,
};
