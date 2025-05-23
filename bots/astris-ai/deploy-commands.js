const { REST, Routes } = require("discord.js");
const fs = require("fs");
const { log } = require("./utils");
const config = require("./config");

const deployCommands = async () => {
  console.log("-----------------------------------------------------");
  log("INFO", "Initialize deployment of slash commands...");

  const commands = [];
  const commandFolders = fs.readdirSync("./commands");

  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`./commands/${folder}/${file}`);
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    log("INFO", "Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    log("SUCCESS", "Successfully reloaded application (/) commands.");
    console.log("-----------------------------------------------------");
  } catch (error) {
    log("ERROR", error);
  }
};

module.exports = { deployCommands };
