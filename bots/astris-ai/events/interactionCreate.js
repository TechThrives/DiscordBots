const { MessageFlags } = require("discord.js");
const { log } = require("../utils");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      log("WARN", `Unknown command attempted: "${interaction.commandName}" by "${interaction.user.tag}"`);
      return;
    }

    // Format options for logging
    const options =
      interaction.options.data.length > 0
        ? interaction.options.data.map((opt) => `${opt.name}: ${opt.value || "No value"}`).join(", ")
        : "No options";

    log(
      "DEBUG",
      `Command "${interaction.commandName}" executed by "${interaction.user.tag}" in "${interaction.channel?.name || "DM"}" [${options}]`
    );

    try {
      // Update bot status if available
      if (interaction.client.setBotStatus) {
        interaction.client.setBotStatus(interaction.client, `Executing /${interaction.commandName}`);
      }

      // Check permissions if command requires them
      if (command.permissions) {
        // Handle DMs (no guild member)
        if (!interaction.member) {
          await interaction.reply({
            content: "This command cannot be used in direct messages.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Check if user has required permissions
        if (interaction.member.permissions.has(command.permissions)) {
          const permissionNames = Array.isArray(command.permissions)
            ? command.permissions.join(", ")
            : command.permissions.toString();

          log(
            "WARN",
            `Permission denied: "${interaction.user.tag}" tried to use "${interaction.commandName}" without required permissions: ${permissionNames}`
          );

          await interaction.reply({
            content: "You don't have the required permissions to use this command.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      // Execute the command
      await command.execute(interaction);

      log("DEBUG", `Command "${interaction.commandName}" completed successfully for "${interaction.user.tag}"`);
    } catch (error) {
      log(
        "ERROR",
        `Command execution failed: "${interaction.commandName}" by "${interaction.user.tag}" - ${error.message}`
      );

      const errorMessage = "There was an error while executing this command!";

      try {
        if (interaction.replied) {
          // Command already replied, can't do anything
          return;
        } else if (interaction.deferred) {
          // Command was deferred, edit the reply
          await interaction.editReply({ content: errorMessage });
        } else {
          // Command hasn't replied yet, send ephemeral reply
          await interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyError) {
        log("ERROR", `Failed to send error message: ${replyError.message}`);
      }
    }
  },
};
