const axios = require("axios");
const config = require("../config");
const { log, loadJSON, getErrorMessage } = require("../utils/common");
const { updateAuthTokenImageFx } = require("../utils/authUtils");

const generateGoogleFx = async (prompt, imageCount = 1, aspectRatio = "IMAGE_ASPECT_RATIO_SQUARE") => {
  const data = {
    userInput: {
      candidatesCount: imageCount,
      prompts: [prompt],
    },
    clientContext: {
      tool: "IMAGE_FX",
    },
    modelInput: {
      modelNameType: "IMAGEN_3_5",
    },
    aspectRatio,
  };

  try {
    let jsonData = loadJSON("./data/tokens.json");

    if (
      !jsonData.googleImageFxKey ||
      !jsonData.googleImageFxKeyExpiry ||
      new Date(jsonData.googleImageFxKeyExpiry) < new Date()
    ) {
      log("INFO", `Google ImageFX token is expired.`);
      await updateAuthTokenImageFx();
      jsonData = loadJSON("./data/tokens.json");
    }

    const response = await axios.post(config.googleImageFxEndpoint, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jsonData.googleImageFxKey}`,
      },
      maxBodyLength: Infinity,
    });

    if (!response?.data?.imagePanels) {
      throw new Error("Invalid response from ImageFX");
    }

    const base64Images = [];
    response.data.imagePanels.forEach((panel) => {
      panel.generatedImages.forEach((image) => {
        const base64 = image.encodedImage;
        if (base64) {
          base64Images.push(base64);
        }
      });
    });

    return base64Images;
  } catch (error) {
    if (error.response?.status === 401) {
      await updateAuthTokenImageFx();
    }
    log("ERROR", `ImageFX Error: ${getErrorMessage(error)}`);
    throw new Error("Failed to generate images. Please try again.");
  }
};

const generateFlux = async (prompt, aspectRatio = "1024:1024") => {
  const [width, height] = aspectRatio.split(":").map(Number);
  const params = new URLSearchParams({
    width,
    height,
    seed: Math.floor(Math.random() * 9000) + 1000,
    safe: true,
    nologo: true,
  });

  try {
    const response = await axios.get(`${config.imageEndpoint}/${prompt}?${params.toString()}`, {
      responseType: "arraybuffer",
    });

    if (!response?.data) {
      throw new Error("Invalid response from Flux");
    }

    const base64Images = [];
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    base64Images.push(base64);

    return base64Images;
  } catch (error) {
    log("ERROR", `Flux Error: ${getErrorMessage(error)}`);
    throw new Error("Failed to generate images. Please try again.");
  }
};

const reGenerate = async (prompt, imageUrl) => {
  const params = new URLSearchParams({
    seed: Math.floor(Math.random() * 9000) + 1000,
    safe: true,
    nologo: true,
    image: imageUrl,
    model: "gptimage",
    token: "gacha11211",
  });

  try {
    const response = await axios.get(`${config.imageEndpoint}/${prompt}?${params.toString()}`, {
      responseType: "arraybuffer",
    });

    if (!response?.data) {
      throw new Error("Invalid response from GPT");
    }

    const base64Images = [];
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    base64Images.push(base64);

    return base64Images;
  } catch (error) {
    log("ERROR", `GPT Error: ${getErrorMessage(error)}`);
    throw new Error("Failed to generate images. Please try again.");
  }
};

module.exports = {
  generateGoogleFx,
  generateFlux,
  reGenerate,
};
