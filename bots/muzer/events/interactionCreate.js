const { MessageFlags, EmbedBuilder } = require("discord.js");
const { log } = require("../utils/common");
const { getCollection } = require("../mongodb");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      log("WARN", `Unknown command attempted: "${interaction.commandName}" by "${interaction.user.username}"`);
      return;
    }

    const options =
      interaction.options.data.length > 0
        ? interaction.options.data.map((opt) => `${opt.name}: ${opt.value ?? "No value"}`).join("\n")
        : "None";

    let success = false;
    let errorMessage = null;

    try {
      if (command.permissions) {
        if (!interaction.member) {
          await interaction.reply({
            content: "This command cannot be used in direct messages.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

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

      log(
        "DEBUG",
        `Command "${interaction.commandName}" executed by "${interaction.user.username}" in "${interaction.channel?.name || "DM"}" [${options}]`,
      );

      await command.execute(interaction);
      success = true;
      log("DEBUG", `Command "${interaction.commandName}" completed successfully for "${interaction.user.tag}"`);
    } catch (error) {
      errorMessage = error.message || "There was an error while executing this command!";
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

    // Send log via webhook
    const guildId = interaction.guild?.id;
    if (guildId) {
      try {
        const guildConfigs = getCollection("GuildConfigs");
        const config = await guildConfigs.findOne({ guildId });

        if (config?.logChannel?.webhook) {
          const { id: webhookId, token: webhookToken } = config.logChannel.webhook;
          const webhook = await interaction.client.fetchWebhook(webhookId, webhookToken);

          const embed = new EmbedBuilder()
            .setTitle("Command Log")
            .addFields(
              { name: "Command", value: `/${interaction.commandName}`, inline: true },
              { name: "User", value: `${interaction.user.tag}`, inline: true },
              { name: "Channel", value: interaction.channel?.name || "DM", inline: true },
              { name: "Options", value: options },
              {
                name: "Status",
                value: success ? "Success" : `Failed - ${errorMessage}`,
                inline: false,
              },
            )
            .setFooter({
              text: interaction.client.user.username,
              iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

          await webhook.send({ embeds: [embed] });
        }
      } catch (err) {
        log("ERROR", `Failed to send command log to webhook: ${err.message}`);
      }
    }
  },
};
