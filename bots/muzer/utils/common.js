const fs = require("fs");
const config = require("../config");

function ensureDirectoryExists(filePath) {
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  if (lastSlash > 0) {
    const dir = filePath.substring(0, lastSlash);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function loadJSON(file) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      return content.trim() ? JSON.parse(content) : {};
    } else {
      ensureDirectoryExists(file);
      fs.writeFileSync(file, "{}", "utf8");
      console.log(`Created new JSON file: ${file}`);
      return {};
    }
  } catch (err) {
    console.error(`Failed to read JSON file: ${file}`, err);
    return {};
  }
}

function updateJSON(key, value, file) {
  let data = loadJSON(file);
  data[key] = value;

  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    console.log(`Updated ${key} in ${file}`);
  } catch (err) {
    console.error(`Failed to write to JSON file: ${file}`, err);
  }
}

function deleteJSON(key, file) {
  let data = loadJSON(file);
  if (key in data) {
    delete data[key];
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
      console.log(`Deleted ${key} from ${file}`);
    } catch (err) {
      console.error(`Failed to delete key from JSON file: ${file}`, err);
    }
  } else {
    console.log(`Key ${key} not found in ${file}`);
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
  try {
    ensureDirectoryExists(file);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    console.log(`Saved data to ${file}`);
  } catch (err) {
    console.error(`Failed to save JSON file: ${file}`, err);
  }
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

  console.log(logMessage);

  if (config.logging) {
    writeLogToFile(logMessage);
  }
};

function getErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Unknown error";
}

module.exports = { updateJSON, loadJSON, deleteJSON, saveJSON, getTimestamp, writeLogToFile, log, getErrorMessage };
