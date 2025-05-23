require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: "1366348446608396338",
    debug: false,
    moderator: "",
    geminiKey: process.env.GEMINI_KEY,
    imageEndpoint: process.env.IMAGE_ENDPOINT,
    port: process.env.PORT || 8080
};
