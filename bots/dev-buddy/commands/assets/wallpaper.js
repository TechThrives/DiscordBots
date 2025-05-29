const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const axios = require("axios");
const path = require("path");
const { loadJSON } = require("../../utils/common");
const { scrapeWallpaper } = require("../../helper/assetsHelper");
const emojis = require("../../emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wallpaper")
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
        content: "Wallpaper channel is not configured. Use `/setwallpaperchannel` to set it first.",
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId);

    const { title, category, resolution, size, tags, downloadUrl } = await scrapeWallpaper(wallpaperUrl);

    const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const originalExtension = downloadUrl.split(".").pop().split("?")[0] || "jpg";
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_${resolution}.${originalExtension}.bin`;

    const file = new AttachmentBuilder(buffer, {
      name: fileName,
      description: `${title} - ${resolution} wallpaper (rename to .${originalExtension} after download)`,
    });

    const thumbnailFile = new AttachmentBuilder(buffer, {
      name: `thumbnail.${originalExtension}`,
      description: "Wallpaper thumbnail",
    });

    const embed = new EmbedBuilder()
      .setTitle("**NEW WALLPAPER DROP**")
      .setDescription(
        [
          `**${title}**`,
          `**Category:** ${category}`,
          `**Original Resolution:** ${resolution}`,
          `**Size:** ${size}`,
          ``,
          `**Tags**`,
          `${tags.map((tag) => "`" + tag + "`").join(" ")}`,
          ``,
          `**Download the file above and rename it to remove .bin extension**`,
          `**${fileName} to ${fileName.replace(".bin", "")}**`,
          ``,
          `**React with ⭐ if you love it!**`,
          `**Drop a 🔥 if you’re using this!**`,
        ].join("\n")
      )
      .setThumbnail(`attachment://thumbnail.${originalExtension}`)
      .setFooter({
        text: `By ${interaction.client.user.username}`,
        iconURL: emojis.footerIcon,
      })
      .setTimestamp();

    const message = await channel.send({ embeds: [embed], files: [file, thumbnailFile] });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Wallpaper sent to <#${channelId}>!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
