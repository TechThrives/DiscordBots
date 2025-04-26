const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.js');
const config = require('../config.js');

function formatDuration(ms) {
    // Return 'LIVE' for streams
    if (!ms || ms <= 0 || ms === 'Infinity') return 'LIVE';

    // Convert to seconds
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    // Format based on length
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getDurationString(track) {
    if (track.info.isStream) return 'LIVE';
    if (!track.info.duration) return 'N/A';
    return formatDuration(track.info.duration);
}

// Helper function to handle both message and interaction responses
function sendResponse(target, content) {
    if (target.reply && target.editReply) {
        // This is an interaction
        if (target.deferred || target.replied) {
            return target.editReply(content);
        } else {
            return target.reply(content);
        }
    } else {
        // This is a channel
        return target.send(content);
    }
}

module.exports = {
    success: (target, message) => {
        return sendResponse(target, `${emojis.success} | ${message}`);
    },

    error: (target, message) => {
        return sendResponse(target, `${emojis.error} | ${message}`);
    },

    nowPlaying: (target, track) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.music} Now Playing`)
            .setDescription(`[${track.info.title}](${track.info.uri})`);

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        const requesterTag = track.info.requester.tag || 
                           `${track.info.requester.username}#${track.info.requester.discriminator || '0000'}`;

        embed.addFields([
            { name: 'Artist', value: `${emojis.info} ${track.info.author}`, inline: true },
            { name: 'Duration', value: `${emojis.time} ${getDurationString(track)}`, inline: true },
            { name: 'Requested By', value: `${emojis.info} ${requesterTag}`, inline: true }
        ])
        .setFooter({ text: 'Use /help to see all commands' });

        return sendResponse(target, { embeds: [embed] });
    },

    addedToQueue: (target, track, position) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Added to queue: [${track.info.title}](${track.info.uri})`);

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        embed.addFields([
            { name: 'Artist', value: `${emojis.info} ${track.info.author}`, inline: true },
            { name: 'Duration', value: `${emojis.time} ${getDurationString(track)}`, inline: true },
            { name: 'Position', value: `${emojis.queue} #${position}`, inline: true }
        ]);

        return sendResponse(target, { embeds: [embed] });
    },

    addedPlaylist: (target, playlistInfo, tracks) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.success} Added Playlist`)
            .setDescription(`**${playlistInfo.name}**`);

        if (playlistInfo.thumbnail && typeof playlistInfo.thumbnail === 'string') {
            embed.setThumbnail(playlistInfo.thumbnail);
        }

        // Calculate total duration excluding streams
        const totalDuration = tracks.reduce((acc, track) => {
            if (!track.info.isStream && track.info.duration) {
                return acc + track.info.duration;
            }
            return acc;
        }, 0);

        embed.addFields([
            { name: 'Total Tracks', value: `${emojis.queue} ${tracks.length} tracks`, inline: true },
            { name: 'Total Duration', value: `${emojis.time} ${formatDuration(totalDuration)}`, inline: true },
            { name: 'Stream Count', value: `${emojis.info} ${tracks.filter(t => t.info.isStream).length} streams`, inline: true }
        ])
        .setFooter({ text: 'The playlist will start playing soon' });

        return sendResponse(target, { embeds: [embed] });
    },

    queueEnded: (target) => {
        return sendResponse(target, `${emojis.info} | Queue has ended. Leaving voice channel.`);
    },

    queueList: (target, queue, currentTrack, currentPage = 1, totalPages = 1) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.queue} Queue List`);

        if (currentTrack) {
            embed.setDescription(
                `**Now Playing:**\n${emojis.play} [${currentTrack.info.title}](${currentTrack.info.uri}) - ${getDurationString(currentTrack)}\n\n**Up Next:**`
            );

            if (currentTrack.info.thumbnail && typeof currentTrack.info.thumbnail === 'string') {
                embed.setThumbnail(currentTrack.info.thumbnail);
            }
        } else {
            embed.setDescription("**Queue:**");
        }

        if (queue.length) {
            const tracks = queue.map((track, i) => 
                `\`${(i + 1).toString().padStart(2, '0')}\` ${emojis.song} [${track.info.title}](${track.info.uri}) - ${getDurationString(track)}`
            ).join('\n');
            embed.addFields({ name: '\u200b', value: tracks });

            // Calculate total duration excluding streams
            const totalDuration = queue.reduce((acc, track) => {
                if (!track.info.isStream && track.info.duration) {
                    return acc + track.info.duration;
                }
                return acc;
            }, 0);

            const streamCount = queue.filter(t => t.info.isStream).length;
            const durationText = streamCount > 0 
                ? `Total Duration: ${formatDuration(totalDuration)} (${streamCount} streams)`
                : `Total Duration: ${formatDuration(totalDuration)}`;

            embed.setFooter({ 
                text: `Total Tracks: ${queue.length} • ${durationText} • Page ${currentPage}/${totalPages}` 
            });
        } else {
            embed.addFields({ name: '\u200b', value: 'No tracks in queue' });
            embed.setFooter({ text: `Page ${currentPage}/${totalPages}` });
        }

        return sendResponse(target, { embeds: [embed] });
    },

    playerStatus: (target, player) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Player Status`)
            .addFields([
                { 
                    name: 'Status', 
                    value: player.playing ? `${emojis.play} Playing` : `${emojis.pause} Paused`, 
                    inline: true 
                },
                { 
                    name: 'Volume', 
                    value: `${emojis.volume} ${player.volume}%`, 
                    inline: true 
                },
                { 
                    name: 'Loop Mode', 
                    value: `${emojis.repeat} ${player.loop === "queue" ? 'Queue' : 'Disabled'}`, 
                    inline: true 
                }
            ]);

        if (player.queue.current) {
            const track = player.queue.current;
            embed.setDescription(
                `**Currently Playing:**\n${emojis.music} [${track.info.title}](${track.info.uri})\n` +
                `${emojis.time} Duration: ${getDurationString(track)}`
            );
            
            if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
                embed.setThumbnail(track.info.thumbnail);
            }
        }

        return sendResponse(target, { embeds: [embed] });
    },

    help: (target, commands) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Available Commands`)
            .setDescription(commands.map(cmd => 
                `${emojis.music} \`/${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
            .setFooter({ text: 'Use / prefix to use commands' });
        
        return sendResponse(target, { embeds: [embed] });
    }
};