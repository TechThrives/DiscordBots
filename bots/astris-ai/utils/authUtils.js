const axios = require("axios");
const config = require("../config");
const { log, getErrorMessage, updateJSON, saveJSON } = require("./common");

const updateAuthTokenImageFx = async () => {
  try {
    log("INFO", `Generating New Access Token...`);

    const response = await axios.get("https://labs.google/fx/api/auth/session", {
      headers: {
        cookie: `__Secure-next-auth.session-token=${config.googleImageFxCookie};`,
      },
    });

    if (!response?.data) {
      throw new Error("Invalid response from ImageFX Auth API");
    }

    if (!response.data.access_token && !response.data.expires) {
      throw new Error("Access token is missing from response");
    }

    const data = {
      googleImageFxKey: response.data.access_token,
      googleImageFxKeyExpiry: response.data.expires,
    };

    saveJSON("./data/tokens.json", data);
  } catch (error) {
    log("ERROR", `ImageFX Auth Error: ${getErrorMessage(error)}`);
  }
};

module.exports = {
  updateAuthTokenImageFx,
};
