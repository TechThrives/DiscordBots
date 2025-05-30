require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    logging: false,
    port: process.env.PORT || 8080,
    omdbApiKey: process.env.OMDB_API_KEY,
    mongodbUri: process.env.MONGODB_URI
};
