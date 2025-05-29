require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    debug: true,
    port: process.env.PORT || 8080,
    omdbApiKey: process.env.OMDB_API_KEY
};
