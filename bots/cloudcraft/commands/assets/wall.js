const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const config = require("../../config");
const { scrapeWallpaper } = require("../../helper/wallpaperHelper");
const emojis = require("../../emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wall")
    .setDescription("Send wallpaper to channel")
    .addStringOption((option) => option.setName("url").setDescription("URL of the wallpaper").setRequired(true))
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to send the wallpaper to").setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const wallpaperUrl = interaction.options.getString("url");
    const channel =
      interaction.options.getChannel("channel") || (await interaction.client.channels.fetch(config.channels.wallpaper));

    const { title, category, resolution, size, tags, downloadUrl } = await scrapeWallpaper(wallpaperUrl);

    const embed = new EmbedBuilder()
      .setTitle("**NEW WALLPAPER DROP**")
      .setDescription(
        [
          `**${title}**`,
          `**Category:** ${category}`,
          `**Original Resolution:** ${resolution}`,
          `**Size:** ${size}`,
          "",
          `**Tags**`,
          `${tags.map((tag) => "`" + `${tag}` + "`").join(" ")}`,
          "",
          `**React with ⭐ if you love it!**`,
          `**Drop a 🔥 if you’re using this!**`,
        ].join("\n")
      )
      .setImage(downloadUrl)
      .setFooter({
        text: `By ${interaction.client.user.username}`,
        iconURL: emojis.footerIcon,
      })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(downloadUrl)
    );

    const message = await channel.send({ embeds: [embed], components: [button] });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Wallpaper sent to ${channel}!`,
    });
  },
};
