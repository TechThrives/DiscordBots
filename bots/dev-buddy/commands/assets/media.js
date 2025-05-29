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
const { getMediaData } = require("../../helper/assetsHelper");
const emojis = require("../../emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("media")
    .setDescription("Send media to the configured channel")
    .addStringOption((option) =>
      option.setName("url").setDescription("URL of the downloadable media").setRequired(true)
    )
    .addStringOption((option) => option.setName("imdb-id").setDescription("IMDB ID").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const url = interaction.options.getString("url");
    const imdbID = interaction.options.getString("imdb-id");
    const configFile = path.join(__dirname, "../../channelsConfig.json");
    const config = loadJSON(configFile);
    const channelId = config.mediaChannel;

    if (!channelId) {
      await interaction.editReply({
        content: "Media channel is not configured. Use `/setmediachannel` to set it first.",
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId);

    const { title, year, released, genre, poster, imdbRating, imdbVotes, type } = await getMediaData(imdbID);

    const embed = new EmbedBuilder()
      .setTitle(`${title} (${year})`)
      .setDescription(
        [
          `**Genre:** ${genre}`,
          `**Released:** ${released}`,
          `**IMDB Rating:** ${imdbRating}/10`,
          `**IMDB Votes:** ${imdbVotes}`,
          `**Type:** ${type}`,
          "",
          `**Drop a ⭐ if you already watched it?**`,
          `**Hit 🔥 if Planning to watch?**`,
        ].join("\n")
      )
      .setImage(poster)
      .setFooter({
        text: `Posted by ${interaction.client.user.username}`,
        iconURL: emojis.footerIcon,
      })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(url)
    );

    const message = await channel.send({ embeds: [embed], components: [button] });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Media sent to <#${channelId}>!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
