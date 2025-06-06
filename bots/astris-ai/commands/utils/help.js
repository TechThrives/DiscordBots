const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const store = require("../../store");

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Get information about the bot and its commands"),

  async execute(interaction) {
    const client = interaction.client;
    const botName = client.user.username;

    // Command stats
    const allCommands = {};
    const commandFolders = fs.readdirSync("./commands");

    for (const folder of commandFolders) {
      if (folder === "admin") continue;
      const fullFolderPath = `./commands/${folder}`;
      if (!fs.statSync(fullFolderPath).isDirectory()) continue;

      const commandFiles = fs.readdirSync(fullFolderPath).filter((file) => file.endsWith(".js"));

      allCommands[folder] = [];

      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        const commandName = command.data.name;
        const commandDescription = command.data.description;

        allCommands[folder].push({
          name: commandName,
          description: commandDescription,
        });
      }
    }

    // Bot stats
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const uptime = process.uptime();
    const uptimeString = formatUptime(uptime);
    const ping = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(store.embedColor)
      .setTitle(`${botName} Help`)
      .setAuthor({
        name: "Bot Information",
        iconURL: store.headerIcon,
      })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**${botName}** is a Ai Based Discord bot.\n\n` +
          `**Servers:** ${totalServers}\n` +
          `**Users:** ${totalUsers}\n` +
          `**Uptime:** ${uptimeString}\n` +
          `**Ping:** ${ping}ms`,
      )
      .setFooter({
        text: "Ai Buddy",
        iconURL: store.footerIcon,
      })
      .setTimestamp();

    Object.entries(allCommands)
      .map(([folder, commands]) => {
        const commandsText = commands.map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`).join("\n");
        embed.addFields({
          name: `${folder.charAt(0).toUpperCase() + folder.slice(1)} Commands`,
          value: commandsText,
        });
      })
      .join("\n\n") || "*No commands found.*";

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

function formatUptime(uptime) {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / 3600) % 24);
  const days = Math.floor(uptime / 86400);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
