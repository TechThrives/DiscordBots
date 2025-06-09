const { ActivityType } = require("discord.js");
const { log } = require("../utils/common");

function setBotStatus(client) {
  try {
    const activePlayers = Array.from(client.riffy.players.values()).filter((player) => player.playing);

    if (!activePlayers.length) {
      client.user.setPresence({
        activities: [
          {
            name: "Enjoy Your Music",
            type: ActivityType.Custom,
          },
        ],
        status: "online",
      });
      return;
    }

    const player = activePlayers[0];

    if (!player.current || !player.current.info || !player.current.info.title) {
      return;
    }

    const trackName = player.current.info.title;

    client.user.setPresence({
      activities: [
        {
          name: "🎵 Now Playing: " + trackName,
          type: ActivityType.Custom,
        },
      ],
      status: "idle",
    });
  } catch (error) {
    log("ERROR", `Failed to set command status: ${error.message}`);
  }
}

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    try {
      client.user.setPresence({
        activities: [
          {
            name: "Enjoy your music",
            type: ActivityType.Custom,
          },
        ],
        status: "online",
      });

      setInterval(() => setBotStatus(client), 5000);

      client.riffy.init(client.user.id);
    } catch (error) {
      console.error("Error setting presence:", error);
    }
  },
};
