const fs = require("fs");
const config = require("../config");

function loadJSON(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (err) {
    console.error(`Failed to read JSON file: ${file}`, err);
  }
  return {};
}

function updateJSON(key, value, file) {
  let data = loadJSON(file);
  data[key] = value;

  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Failed to write to JSON file: ${file}`, err);
  }
}

const getTimestamp = () => {
  const now = new Date();
  const timestamp = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }).replace(/,/g, "");
  return `[${timestamp}]`;
};

const writeLogToFile = (message) => {
  const logMessage = `${getTimestamp()} ${message}\n`;
  fs.appendFileSync("./data/bot.log", logMessage, "utf8");
};

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

const log = (type, message) => {
  const types = {
    INFO: "\x1b[34mINFO\x1b[0m", // Blue
    SUCCESS: "\x1b[32mSUCCESS\x1b[0m", // Green
    ERROR: "\x1b[31mERROR\x1b[0m", // Red
    WARN: "\x1b[33mWARNING\x1b[0m", // Yellow
    DEBUG: "\x1b[35mDEBUG\x1b[0m", // Purple
  };

  const timestamp = getTimestamp();
  const logMessage = `${timestamp} ${types[type]}: ${message}`;

  if (config.debug) {
    console.log(logMessage);
    writeLogToFile(logMessage);
  } else if (type !== "DEBUG") {
    console.log(logMessage);
  }
};

module.exports = { updateJSON, loadJSON, saveJSON, getTimestamp, writeLogToFile, log };