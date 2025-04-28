const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require("discord.js");
const config = require("./config.js");
const emojis = require("./emojis.js");
const messages = require("./utils/messages.js");
const ai = require("./utils/aiHelper.js");
const fs = require("fs");
const express = require("express");

const app = express();
const port = config.server.port;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AstrisAI is running!" });
});

app.get("/ping", (req, res) => {
  res.json({ message: "Pong!" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Command Collection
client.commands = new Collection();

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with AstrisAI")
    .addStringOption((option) =>
      option.setName("message").setDescription("Your message to AstrisAI").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Get a joke from AstrisAI")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Type of joke")
        .setRequired(false)
        .addChoices(
          { name: "General", value: "general" },
          { name: "Programming", value: "programming" },
          { name: "Dad Joke", value: "dad" },
          { name: "Pun", value: "pun" }
        )
    ),

  new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generate an image")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Description of the image you want to generate").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("size")
        .setDescription("Size of the image")
        .setRequired(false)
        .addChoices(
          { name: "1:1", value: "1024:1024" },
          { name: "9:16", value: "768:1366" },
          { name: "16:9", value: "1366:768" }
        )
    ),

  new SlashCommandBuilder().setName("help").setDescription("Show all available commands"),

  new SlashCommandBuilder().setName("reset").setDescription("Reset the AI conversation history in this channel"),
];

// Function to register slash commands
async function registerCommands() {
  try {
    console.log("Started refreshing application (/) commands.");

    const rest = new REST({ version: "10" }).setToken(config.botToken);

    await rest.put(Routes.applicationCommands(config.clientId), { body: commands.map((command) => command.toJSON()) });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

client.on("ready", async () => {
  console.log(`${emojis.success} Logged in as ${client.user.tag}`);

  // Register commands when the bot starts
  await registerCommands();
});

// Store AI-enabled channel IDs
const aiTextChannels = new Set();
const aiImageChannels = new Set();

// Load AI channels from config if they exist
if (config.aiTextChannels && Array.isArray(config.aiTextChannels)) {
  config.aiTextChannels.forEach((channelId) => aiTextChannels.add(channelId));
}
if (config.aiImageChannels && Array.isArray(config.aiImageChannels)) {
  config.aiImageChannels.forEach((channelId) => aiImageChannels.add(channelId));
}

// Handle regular messages in AI channels
client.on("messageCreate", async (message) => {
  // Ignore bot messages to prevent loops
  if (message.author.bot) return;

  // Check if this is an AI-enabled channel
  if (aiTextChannels.has(message.channelId)) {
    try {
      message.channel.sendTyping();
      const response = await ai.chatWithGemini(message.content);
      message.reply(response);
    } catch (error) {
      console.error("Error processing AI channel message:", error);
      messages.reply("I encountered an error processing your message. Please try again later.");
    }
  }

  // Check if this is an AI image channel
  if (aiImageChannels.has(message.channelId)) {
    let loadingMessage;
    try {
      await message.channel.sendTyping();
      loadingMessage = await message.reply(`${emojis.loading} Generating image...`);
      const imagePath = await ai.generateImage(message.content);
      loadingMessage.edit({
        content: `${emojis.image} Here is your generated image:`,
        files: [imagePath],
      });
    } catch (error) {
      console.error("Error processing AI image channel message:", error);
      loadingMessage.edit("I encountered an error generating the image. Please try again later.");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "help": {
      const helpCommands = commands.map((cmd) => ({
        name: cmd.name + (cmd.options?.length ? " " + cmd.options.map((opt) => `<${opt.name}>`).join(" ") : ""),
        description: cmd.description,
      }));

      await interaction.deferReply();
      messages.help(interaction, helpCommands);
      break;
    }

    case "chat": {
      await interaction.deferReply();

      try {
        const message = interaction.options.getString("message");
        const response = await ai.chatWithGemini(message);
        messages.success(interaction, response);
      } catch (error) {
        console.error("Error in chat command:", error);
        messages.error(interaction, "An error occurred while processing your request.");
      }
      break;
    }

    case "joke": {
      await interaction.deferReply();

      try {
        const category = interaction.options.getString("category") || "general";
        const joke = await ai.generateJoke(category);
        messages.success(interaction, joke);
      } catch (error) {
        console.error("Error in joke command:", error);
        messages.error(interaction, "An error occurred while generating the joke.");
      }
      break;
    }

    case "generate": {
      await interaction.deferReply();

      try {
        const prompt = interaction.options.getString("prompt");
        const size = interaction.options.getString("size") || "1024:1024";
        const [width, height] = size.split(":").map(Number);
        const imagePath = await ai.generateImage(prompt, width, height);

        messages.image(interaction, imagePath, prompt);
      } catch (error) {
        console.error("Error in generate command:", error);
        messages.error(interaction, "An error occurred while generating the image.");
      }
      break;
    }

    case "reset": {
      // Check if this is an AI channel
      if (!aiTextChannels.has(interaction.channelId)) {
        messages.error(interaction, "This command can only be used in AI-enabled channels.");
        return;
      }

      // Clear conversation history
      ai.clearConversationHistory(interaction.channelId);
      messages.success(interaction, `Conversation history has been reset. The AI will start fresh.`);
      break;
    }
  }
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

client.login(config.botToken);
