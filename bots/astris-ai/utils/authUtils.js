const axios = require("axios");
const { log, getErrorMessage } = require("./common");
const { getCollection } = require("../mongodb");
const { DATA } = require("../constants");

const updateAuthTokenImageFx = async (guildId) => {
  try {
    log("INFO", "Generating new access token...");

    const guildDatas = getCollection("GuildDatas");
    const guildData = await guildDatas.findOne({ guildId });

    if (!guildData?.[DATA.image_fx_cookie.dbField]) {
      throw new Error("Google ImageFX cookie is missing");
    }

    const response = await axios.get("https://labs.google/fx/api/auth/session", {
      headers: {
        cookie: `__Secure-next-auth.session-token=${guildData[DATA.image_fx_cookie.dbField]};`,
        Origin: "https://labs.google",
        Referer: "https://labs.google",
      },
    });

    const { data } = response;
    if (!data) throw new Error("Invalid response from ImageFX Auth API");
    if (data.error) throw new Error(data.error);
    if (!data.access_token || !data.expires) {
      throw new Error("Access token or expiry missing from response");
    }

    const updateData = {
      [DATA.image_fx_key.dbFieldKey]: data.access_token,
      [DATA.image_fx_key.dbFieldExpiry]: data.expires,
    };

    await guildDatas.updateOne({ guildId }, { $set: updateData }, { upsert: true });
    log("INFO", `Successfully updated access token for guild ${guildId}`);
  } catch (error) {
    log("ERROR", `ImageFX Auth Error: ${getErrorMessage(error)}`);
    throw error;
  }
};

module.exports = { updateAuthTokenImageFx };
