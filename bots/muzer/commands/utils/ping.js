const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency and uptime"),

  async execute(interaction) {
    const client = interaction.client;

    try {
      const start = Date.now();
      await interaction.reply({ content: "Pinging...", flags: MessageFlags.Ephemeral });
      const latency = Date.now() - start;
      const websocketPing = client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor("#fe8a7a")
        .setAuthor({ name: "Pong!", iconURL: icons.headerIcon })
        .setDescription(
          `**Response Time:** ${latency}ms\n**WebSocket Ping:** ${websocketPing}ms\n**Uptime:** ${formatUptime(client.uptime)}`,
        )
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error("Error processing ping command:", error);
    }
  },
};

function formatUptime(uptime) {
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
