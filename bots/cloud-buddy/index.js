const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const { deployCommands } = require("./deploy-commands");
const { log } = require("./utils/common");
const config = require("./config");
const express = require("express");

const client = new Client({
  intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();

console.log("                   \x1b[35mStarting the Discord bot...\x1b[0m");

console.log("\x1b[34m");
console.log(`
    ██████╗  ██████╗ ████████╗    ██████╗  █████╗ ███████╗███████╗
    ██╔══██╗██╔═══██╗╚══██╔══╝    ██╔══██╗██╔══██╗██╔════╝██╔════╝
    ██████╔╝██║   ██║   ██║       ██████╔╝███████║███████╗█████╗  
    ██╔══██╗██║   ██║   ██║       ██╔══██╗██╔══██║╚════██║██╔══╝  
    ██████╔╝╚██████╔╝   ██║       ██████╔╝██║  ██║███████║███████╗
    ╚═════╝  ╚═════╝    ╚═╝       ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
`);
console.log("\x1b[0m");

log("INFO", "Loading commands...");
const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
  if (!fs.statSync(`./commands/${folder}`).isDirectory()) continue;
  log("INFO", `Loading commands from folder: ${folder}`);
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.data.name, command);
    log("SUCCESS", `Command loaded: ${command.data.name}`);
  }
}

log("INFO", "Loading events...");
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.on(event.name, (...args) => event.execute(...args));
  log("SUCCESS", `Event loaded: ${file.replace(".js", "")}`);
}

client
  .login(config.token)
  .then(async() => {
    await deployCommands();
    log("SUCCESS", `Bot successfully logged in as ${client.user.tag}`);
  })
  .catch((err) => {
    log("ERROR", `Failed to login: ${err.message}`);
  });

const app = express();
const port = config.port;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AstrisAI is running!" });
});

app.listen(port, () => {
  log("SUCCESS", `Server started on port ${port}`);
});
