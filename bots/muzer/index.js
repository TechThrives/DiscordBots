const { 
    Client, 
    GatewayDispatchEvents, 
    GatewayIntentBits, 
    Collection,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");
const { Riffy } = require("riffy");
const { Spotify } = require("riffy-spotify");
const config = require("./config.js");
const messages = require("./utils/messages.js");
const emojis = require("./emojis.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

const spotify = new Spotify({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

client.riffy = new Riffy(client, config.nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4",
    plugins: [spotify]
});

// Command Collection
client.commands = new Collection();

// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Song or playlist to play')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track'),
    
    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the current track'),
    
    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track'),
    
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playback and clear queue'),
    
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current queue'),
    
    new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show current track info'),
    
    new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust player volume')
        .addIntegerOption(option => 
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    
    new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    
    new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle queue loop mode'),
    
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a track from queue')
        .addIntegerOption(option => 
            option.setName('position')
                .setDescription('Position of the track to remove')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the current queue'),
    
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show player status'),
    
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
];

// Function to register slash commands
async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        
        const rest = new REST({ version: '10' }).setToken(config.botToken);
        
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands.map(command => command.toJSON()) },
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

client.on("ready", async () => {
    client.riffy.init(client.user.id);
    console.log(`${emojis.success} Logged in as ${client.user.tag}`);
    
    // Register commands when the bot starts
    await registerCommands();
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Check if user is in a voice channel for music commands
    const musicCommands = ["play", "skip", "stop", "pause", "resume", "queue", "nowplaying", "volume", "shuffle", "loop", "remove", "clear", "status"];
    if (musicCommands.includes(commandName)) {
        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: `${emojis.error} | You must be in a voice channel!`, ephemeral: true });
        }
    }

    switch (commandName) {
        case "help": {
            const helpCommands = commands.map(cmd => ({
                name: cmd.name + (cmd.options?.length ? ' ' + cmd.options.map(opt => `<${opt.name}>`).join(' ') : ''),
                description: cmd.description
            }));
            
            await interaction.deferReply();
            messages.help(interaction, helpCommands);
            break;
        }

        case "play": {
            const query = interaction.options.getString('query');
            
            await interaction.deferReply();
            
            try {
                const player = client.riffy.createConnection({
                    guildId: interaction.guild.id,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    deaf: true,
                });

                const resolve = await client.riffy.resolve({
                    query: query,
                    requester: interaction.user,
                });

                const { loadType, tracks, playlistInfo } = resolve;

                if (loadType === "playlist") {
                    for (const track of resolve.tracks) {
                        track.info.requester = interaction.user;
                        player.queue.add(track);
                    }

                    messages.addedPlaylist(interaction, playlistInfo, tracks);
                    if (!player.playing && !player.paused) return player.play();
                } else if (loadType === "search" || loadType === "track") {
                    const track = tracks.shift();
                    track.info.requester = interaction.user;
                    const position = player.queue.length + 1;
                    player.queue.add(track);
                    
                    messages.addedToQueue(interaction, track, position);
                    if (!player.playing && !player.paused) return player.play();
                } else {
                    return messages.error(interaction, "No results found! Try with a different search term.");
                }
            } catch (error) {
                console.error(error);
                return messages.error(interaction, "An error occurred while playing the track! Please try again later.");
            }
            break;
        }

        case "skip": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (!player.queue.length) return messages.error(interaction, "No more tracks in queue to skip to!");
            
            await interaction.deferReply();
            player.stop();
            messages.success(interaction, "Skipped the current track!");
            break;
        }

        case "stop": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            
            await interaction.deferReply();
            player.destroy();
            messages.success(interaction, "Stopped the music and cleared the queue!");
            break;
        }

        case "pause": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (player.paused) return messages.error(interaction, "The player is already paused!");
            
            await interaction.deferReply();
            player.pause(true);
            messages.success(interaction, "Paused the music!");
            break;
        }

        case "resume": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (!player.paused) return messages.error(interaction, "The player is already playing!");
            
            await interaction.deferReply();
            player.pause(false);
            messages.success(interaction, "Resumed the music!");
            break;
        }

        case "queue": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            
            await interaction.deferReply();
            const queue = player.queue;
            if (!queue.length && !player.queue.current) {
                return messages.error(interaction, "Queue is empty! Add some tracks with the play command.");
            }

            messages.queueList(interaction, queue, player.queue.current);
            break;
        }

        case "nowplaying": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (!player.queue.current) return messages.error(interaction, "No track is currently playing!");

            await interaction.deferReply();
            messages.nowPlaying(interaction, player.queue.current);
            break;
        }

        case "volume": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            
            const volume = interaction.options.getInteger('level');
            
            await interaction.deferReply();
            player.setVolume(volume);
            messages.success(interaction, `Set volume to ${volume}%`);
            break;
        }

        case "shuffle": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (!player.queue.length) return messages.error(interaction, "Not enough tracks in queue to shuffle!");

            await interaction.deferReply();
            player.queue.shuffle();
            messages.success(interaction, `${emojis.shuffle} Shuffled the queue!`);
            break;
        }

        case "loop": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");

            await interaction.deferReply();
            // Get the current loop mode and toggle between NONE and QUEUE
            const currentMode = player.loop;
            const newMode = currentMode === "none" ? "queue" : "none";
            
            player.setLoop(newMode);
            messages.success(interaction, `${newMode === "queue" ? "Enabled" : "Disabled"} loop mode!`);
            break;
        }

        case "remove": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            
            const position = interaction.options.getInteger('position');
            if (position < 1 || position > player.queue.length) {
                return messages.error(interaction, `Please provide a valid track position between 1 and ${player.queue.length}!`);
            }

            await interaction.deferReply();
            const removed = player.queue.remove(position - 1);
            messages.success(interaction, `Removed **${removed.info.title}** from the queue!`);
            break;
        }

        case "clear": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "Nothing is playing!");
            if (!player.queue.length) return messages.error(interaction, "Queue is already empty!");

            await interaction.deferReply();
            player.queue.clear();
            messages.success(interaction, "Cleared the queue!");
            break;
        }

        case "status": {
            const player = client.riffy.players.get(interaction.guild.id);
            if (!player) return messages.error(interaction, "No active player found!");

            await interaction.deferReply();
            messages.playerStatus(interaction, player);
            break;
        }
    }
});

client.riffy.on("nodeConnect", (node) => {
    console.log(`${emojis.success} Node "${node.name}" connected.`);
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`${emojis.error} Node "${node.name}" encountered an error: ${error.message}.`);
});

client.riffy.on("trackStart", async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) messages.nowPlaying(channel, track);
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    player.destroy();
    if (channel) messages.queueEnded(channel);
});

client.on("raw", (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

client.login(config.botToken);