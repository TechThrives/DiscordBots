const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const { deployCommands } = require("./deploy-commands");
const { log } = require("./utils");
const config = require("./config");
const express = require("express");

deployCommands()
  .then(() => {
    log("SUCCESS", "Slash commands deployed successfully.");
  })
  .catch((err) => {
    log("ERROR", `Failed to deploy slash commands: ${err.message}`);
  });

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
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
console.log("                   ---------------------------");

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

console.log("-----------------------------------------------------");

log("INFO", "Loading events...");
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.on(event.name, (...args) => event.execute(...args));
  log("SUCCESS", `Event loaded: ${file.replace(".js", "")}`);
}

client
  .login(config.token)
  .then(() => {
    log("SUCCESS", `Bot successfully logged in as ${client.user.tag}`);
  })
  .catch((err) => {
    log("ERROR", `Failed to login: ${err.message}`);
  });

const app = express();
const port = config.port;

app.get("/", (req, res) => {
  res.json({ message: "AstrisAI is running!" });
});

app.listen(port, () => {
  log("SUCCESS", `Server started on port ${port}`);
});
