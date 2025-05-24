const { MessageFlags } = require("discord.js");
const { log } = require("../utils");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    const options = interaction.options.data.map((opt) => `- ${opt.name}: ${opt.value || "No value"}`).join("\n");

    log(
      "DEBUG",
      `Command executed: "${interaction.commandName}" by "${interaction.user.tag}" in "${interaction.channel?.name || "DM"}" - ${options || "No options provided."}`
    );

    try {
      if (interaction.client.setBotStatus) {
        interaction.client.setBotStatus(interaction.client, `Executing command /${interaction.commandName}`);
      }
      await command.execute(interaction);
    } catch (error) {
      log(
        "ERROR",
        `Error executing command: "${interaction.commandName}" by "${interaction.user.tag}" - ${error.message}`
      );
      if (interaction.deferred) {
        return interaction.editReply({
          content: "There was an error while executing this command!",
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
