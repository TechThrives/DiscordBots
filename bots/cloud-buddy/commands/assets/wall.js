const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const path = require("path");
const { loadJSON } = require("../../utils/common");
const { scrapeWallpaper } = require("../../helper/assetsHelper");
const emojis = require("../../emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wall")
    .setDescription("Send wallpaper to the configured channel")
    .addStringOption((option) => option.setName("url").setDescription("URL of the wallpaper").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const wallpaperUrl = interaction.options.getString("url");
    const configFile = path.join(__dirname, "../../channelsConfig.json");
    const config = loadJSON(configFile);
    const channelId = config.wallpaperChannel;

    if (!channelId) {
      await interaction.editReply({
        content: "Wallpaper channel is not configured. Use `/setwallchannel` to set it first.",
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId);

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
          `${tags.map((tag) => "`" + tag + "`").join(" ")}`,
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
      content: `Wallpaper sent to <#${channelId}>!`,
    });
  },
};
