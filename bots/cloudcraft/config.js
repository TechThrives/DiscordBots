require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: "1366348446608396338",
    channels:{
        wallpaper: "1376461509818974218",
    },
    debug: true,
    port: process.env.PORT || 8080
};
