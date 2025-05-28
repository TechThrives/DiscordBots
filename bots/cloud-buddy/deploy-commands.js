const { REST, Routes } = require("discord.js");
const fs = require("fs");
const { log } = require("./utils/common");
const config = require("./config");

const deployCommands = async () => {
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
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    log("SUCCESS", "Successfully deployed application (/) commands.");
  } catch (error) {
    log("ERROR", `Failed to deploy slash commands: ${error.message}`);
  }
};

module.exports = { deployCommands };
