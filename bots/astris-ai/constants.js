const CHANNELS = {
  img_generation: {
    dbField: "imgGenerationChannel",
    displayName: "Image Generation Channel",
  },
  text_generation: {
    dbField: "textChannel",
    displayName: "Ai Text Channel",
  },
};

const DATA = {
  image_fx_cookie: {
    option: "cookie",
    dbField: "imageFxCookie",
    displayName: "Image Fx Cookie",
  },
  image_fx_key: {
    dbFielFdKey: "imageFxKey",
    dbFieldExpiry: "imageFxKeyExpiry",
    displayName: "Image Fx Key",
  },
};

module.exports = {
  CHANNELS,
  DATA,
};
