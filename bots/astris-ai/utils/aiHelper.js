const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const config = require("../config.js");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Store conversation history per channel
const channelConversations = new Map();

// Maximum conversation history items to store per channel
const MAX_HISTORY_LENGTH = 10;

module.exports = {
  chatWithGemini: async function (message, channelId = null) {
    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      let prompt = message;
      
      // If channelId is provided, use conversation history
      if (channelId) {
        // Get or initialize conversation history for this channel
        if (!channelConversations.has(channelId)) {
          channelConversations.set(channelId, []);
        }
        
        const history = channelConversations.get(channelId);
        
        // Create chat session with history
        const chat = model.startChat({
          history: history,
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });
        
        // Send message and get response
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        
        // Update conversation history
        history.push({ role: "user", parts: [{ text: message }] });
        history.push({ role: "model", parts: [{ text: responseText }] });
        
        // Trim history if it gets too long
        if (history.length > MAX_HISTORY_LENGTH * 2) {
          // Remove oldest messages but keep at least one exchange
          channelConversations.set(
            channelId,
            history.slice(-MAX_HISTORY_LENGTH * 2)
          );
        }
        
        return responseText;
      } else {
        // Simple one-off generation without history
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.error("Error with Gemini API:", error);
      return "I encountered an error processing your request. Please try again later.";
    }
  },

  clearConversationHistory: function(channelId) {
    if (channelConversations.has(channelId)) {
      channelConversations.delete(channelId);
      return true;
    }
    return false;
  },

  generateJoke: async function (category = "general") {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Tell me a ${category} joke. Keep it clean and family-friendly. Only respond with the joke itself.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating joke:", error);
      return "I couldn't think of a joke right now. My humor circuits need maintenance!";
    }
  },

  generateImage: async function (prompt, width = 1024, height = 1024) {
    try {
      const params = new URLSearchParams({
        width,
        height,
        seed: Math.floor(Math.random() * 9000) + 1000,
        safe: true,
        nologo: true,
      });
      const response = await axios.get(
        `${config.imageGeneration.apiEndpoint}/${prompt}?${params.toString()}`,
        {
          responseType: "arraybuffer",
        }
      );
      // Save the image temporarily
      const imagePath = path.join(__dirname, "..", "temp", `generated-${Date.now()}.png`);
      // Ensure temp directory exists
      if (!fs.existsSync(path.join(__dirname, "..", "temp"))) {
        fs.mkdirSync(path.join(__dirname, "..", "temp"), { recursive: true });
      }
      fs.writeFileSync(imagePath, response.data);
      setTimeout(() => {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting temp image:", err);
        });
      }, 60000); // Delete after 1 minute
      return imagePath;
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error("Failed to generate image");
    }
  },
};