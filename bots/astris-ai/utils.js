const fs = require('fs');
const config = require('./config');

function loadJSON(file) {
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } else {
        return {};
    }
}

const formatOptions = (interaction) => {
    if (!interaction.options || !interaction.options.data.length) return "No options provided.";

    return interaction.options.data.map(opt => 
        `- ${opt.name}: ${opt.value || "No value"}`
    ).join("\n");
};

const getTimestamp = () => {
  const now = new Date();
  const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).replace(/,/g, '');
  return `[${timestamp}]`;
};

const writeLogToFile = (message) => {
    const logMessage = `${getTimestamp()} ${message}\n`;
    fs.appendFileSync('./data/bot.log', logMessage, 'utf8');
};

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));  
}

const log = (type, message, data = null) => {
    const types = {
        INFO: '\x1b[34mINFO\x1b[0m', // Blue
        SUCCESS: '\x1b[32mSUCCESS\x1b[0m', // Green
        ERROR: '\x1b[31mERROR\x1b[0m', // Red
        DEBUG: '\x1b[35mDEBUG\x1b[0m', // Purple
    };

    const timestamp = getTimestamp();
    let logMessage = `${timestamp} ${types[type]}: ${message}`;

    if (data) {
        if (typeof data === "object") {
            logMessage += `\n📌 Data: ${formatOptions(data)}`;
        } else {
            logMessage += ` | 📌 ${data}`;
        }
    }

    if (config.debug) {
        console.log(logMessage);
        writeLogToFile(logMessage);
    } else if (type !== "DEBUG") {
        console.log(logMessage);
    }
};

module.exports = { loadJSON, saveJSON, getTimestamp, writeLogToFile, formatOptions, log };
