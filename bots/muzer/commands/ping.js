const { EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../config.js");
const musicIcons = require("../ui/icons/musicicons.js");

module.exports = {
  name: "ping",
  description: "Check the bot latency",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction, lang) => {
    try {
      const start = Date.now();
      await interaction.reply({ content: lang.ping.response, flags: MessageFlags.Ephemeral });

      const end = Date.now();
      const latency = end - start;
      const websocketPing = client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setAuthor({
          name: lang.ping.embed.title,
          iconURL: musicIcons.pingIcon,
        })
        .setDescription(
          `${lang.ping.embed.responseTime.replace("{latency}", latency)}
          \n${lang.ping.embed.websocketPing.replace("{ping}", websocketPing)}
          \n${lang.ping.embed.uptime.replace("{uptime}", formatUptime(client.uptime))}`
        )
        .setFooter({ text: lang.ping.embed.footer, iconURL: musicIcons.heartIcon })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (e) {
      console.error(e);
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
