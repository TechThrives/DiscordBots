const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const axios = require("axios");
const { getCollection } = require("../../mongodb");
const { scrapeWallpaper } = require("../../helper/assetsHelper");
const store = require("../../store");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wallpaper")
    .setDescription("Send wallpaper to the configured channel")
    .addStringOption((option) => option.setName("url").setDescription("URL of the wallpaper").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const wallpaperUrl = interaction.options.getString("url");
    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config || !config.wallpaperChannel || !config.wallpaperChannel.webhook) {
      await interaction.editReply({
        content: "Wallpaper channel is not configured. Use `/setchannel wallpaper` to set it first.",
      });
      return;
    }

    const { id: webhookId, token: webhookToken } = config.wallpaperChannel.webhook;

    const webhook = await interaction.client.fetchWebhook(webhookId, webhookToken);

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
      .setColor(store.embedColor)
      .setAuthor({ name: "Download Now", iconURL: store.headerIcon })
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
          `**Drop a 🔥 if you're using this!**`,
        ].join("\n"),
      )
      .setThumbnail(`attachment://thumbnail.${originalExtension}`)
      .setFooter({
        text: `Posted by ${webhook.name}`,
        iconURL: store.footerIcon,
      })
      .setTimestamp();

    await webhook.send({
      files: [file],
    });

    const message = await webhook.send({
      embeds: [embed],
      files: [thumbnailFile],
    });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Wallpaper sent to the <#${config.wallpaperChannel.id}> channel!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
