const { MongoClient } = require("mongodb");
const config = require("./config.js");
const { log } = require("./utils/common.js");

let client;
let db;

async function connectToDatabase() {
  const uri = config.mongodbUri;

  if (!uri) {
    log("WARNING", "MongoDB URI is not defined in the configuration.");
    return;
  }

  try {
    client = new MongoClient(uri);

    await client.connect();
    db = client.db(); // Default DB from URI
    log("INFO", "Connected to MongoDB.");
  } catch (err) {
    log("ERROR", "Failed to connect to MongoDB.");
    console.error(err);
  }
}

function getCollection(name) {
  if (!db) {
    log("ERROR", `Tried to access collection "${name}" before MongoDB connection was established.`);
    return null;
  }
  return db.collection(name);
}

async function disconnectFromDatabase() {
  if (client) {
    await client.close();
    log("INFO", "Disconnected from MongoDB.");
  }
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  getCollection,
};
