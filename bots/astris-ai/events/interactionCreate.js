const { MessageFlags } = require("discord.js");
const { log, formatOptions } = require("../utils/common");
const { getCollection } = require("../mongodb");

async function getAllowedChannel(interaction, configField) {
  const guildConfigs = getCollection("GuildConfigs");
  const guildId = interaction.guildId;

  const config = await guildConfigs.findOne({ guildId });

  const allowedChannels = config?.[configField];

  if (!Array.isArray(allowedChannels) || allowedChannels.length === 0) {
    return { isAllowed: false, allowedChannels: [] };
  }

  const isAllowed = allowedChannels.includes(interaction.channel.id);

  return {
    isAllowed,
    allowedChannels,
  };
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.guild) {
      await interaction.reply({
        content: "This command cannot be used in direct messages.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      log("WARN", `Unknown command attempted: "${interaction.commandName}" by "${interaction.user.username}"`);
      return;
    }

    const options = formatOptions(interaction.options.data);

    try {
      if (interaction.client.setBotStatus) {
        interaction.client.setBotStatus(interaction.client, `Executing /${interaction.commandName}`);
      }

      if (command.permissions) {
        if (!interaction.member.permissions.has(command.permissions)) {
          const permissionNames = Array.isArray(command.permissions)
            ? command.permissions.join(", ")
            : command.permissions.toString();

          log(
            "WARN",
            `Permission denied: "${interaction.user.tag}" tried to use "${interaction.commandName}" without required permissions: ${permissionNames}`,
          );

          await interaction.reply({
            content: "You don't have the required permissions to use this command.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      if (command.requiresSpecificChannel && typeof command.requiresSpecificChannel === "string") {
        const { isAllowed, allowedChannels } = await getAllowedChannel(interaction, command.requiresSpecificChannel);

        if (!isAllowed) {
          const mentionList = allowedChannels.map((id) => `<#${id}>`).join(" or ");

          await interaction.reply({
            content:
              allowedChannels.length > 0
                ? `You can only use this command in ${mentionList}.`
                : `You can't use this command in this channel.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      log(
        "DEBUG",
        `Command "${interaction.commandName}" executed by "${interaction.user.username}" in "${interaction.channel?.name || "DM"}" [${options}]`,
      );

      await command.execute(interaction);
      log("DEBUG", `Command "${interaction.commandName}" completed successfully for "${interaction.user.tag}"`);
    } catch (error) {
      const errorMessage = error.message || "There was an error while executing this command!";
      log(
        "ERROR",
        `Command execution failed: "${interaction.commandName}" by "${interaction.user.tag}" - ${errorMessage}`,
      );

      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
          setTimeout(async () => {
            await interaction.deleteReply();
          }, 5000);
        }
      } catch (replyError) {
        log("ERROR", `Failed to send error message: ${replyError.message}`);
      }
    }
  },
};
