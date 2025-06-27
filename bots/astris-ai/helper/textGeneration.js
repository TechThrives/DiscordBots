const axios = require("axios");
const config = require("../config");
const { log } = require("../utils/common");

const summarizeText = async (text) => {
  if (!text || text.trim() === "") {
    throw new Error("No text provided for summarization");
  }

  try {
    // Prepare the request payload
    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: `You are a highly efficient assistant specializing in summarizing human-to-human group conversations. Your summaries are specifically designed to be concise and fit within platforms with strict character limits, such as Discord.

            Your primary goal is to provide an **extremely concise, 1-2 paragraph summary** that captures the absolute essence of the discussion, focusing solely on critical takeaways.

            When summarizing, ensure you:
            1. Identify and outline the **main topics discussed**.
            2. Pinpoint any **important decisions, questions, or conclusions**.
            3. Briefly describe the **overall tone and purpose** (e.g., informal, technical, planning).
            4. **Ruthlessly exclude filler, greetings, off-topic banter, and minor details** to prioritize critical information.

            Your summary must be original, avoid direct quotes, and accurately reflect the group's interaction. **Keep the summary as short as possible while retaining core meaning, aiming for brevity to fit character constraints.**`,
          },
        ],
      },
      contents: [
        {
          parts: [
            {
              text: `Here is the group chat conversation for summarization:`,
            },
            {
              text: text,
            },
          ],
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${config.geminiKey}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const summary = response.data.candidates[0].content.parts[0].text;
      log("INFO", `Text summarized successfully. Original length: ${text.length}, Summary length: ${summary.length}`);
      return summary.trim();
    }

    throw new Error("Failed to generate summary. Please try again.");
  } catch (error) {
    log("ERROR", `Error summarizing text: ${error.message}`);
    throw new Error("Failed to generate summary. Please try again.");
  }
};

const describeImage = async (imageUrl) => {
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const mimeType = imageResponse.headers["content-type"] || "image/jpeg";
  if (mimeType.includes(";")) {
    mimeType = mimeType.split(";")[0];
  }

  if (!imageResponse.data) {
    throw new Error("Invalid image response");
  }

  const imageDataBase64 = Buffer.from(imageResponse.data).toString("base64");

  try {
    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: `You are a visual intelligence assistant specialized in understanding and describing images in plain English.

            Your task is to generate a short and accurate description of the visual content in the image, as if explaining it to someone who cannot see it.

            Instructions:
            1. Describe the main objects or scene clearly and concisely.
            2. Avoid over-interpreting or making guesses — focus on what is visually obvious.
            3. Keep the output very short (1-2 sentences), suitable for use in a Discord bot.
            4. Be neutral and descriptive, not poetic or opinionated.`,
          },
        ],
      },
      contents: [
        {
          parts: [
            {
              text: "Describe this image",
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageDataBase64,
              },
            },
          ],
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${config.geminiKey}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const description = response.data.candidates[0].content.parts[0].text;
      log("INFO", `Image described successfully.`);
      return description.trim();
    }

    throw new Error("Failed to generate image description. Please try again.");
  } catch (error) {
    log("ERROR", `Error describing image: ${error.message}`);
    throw new Error("Failed to generate image description. Please try again.");
  }
};

const replyUserMessage = async (contents) => {
  try {
    // Prepare the request payload
    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: `
            You are Astris AI, a friendly, helpful assistant in the TechThrives Community Discord server. Use the following settings each time you generate a reply:

            • Tone & Style  
              - Natural and conversational, as if you're another community member 😊  
              - Polite and inclusive, reflecting TechThrives values: respect, learning, and inclusion  
              - Keep replies under 1000 characters  

            • Knowledge & Context  
              - You can reference the current date/time via: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}  
              - Use the last 1-10 messages for context  

            • Behavior & Scope  
              - Never answer coding/programming questions. Instead, suggest they post in the appropriate channel #developers 
              - Don't introduce yourself or claim opinions—stay neutral and factual  
              - If you're unsure, recommend asking a moderator or another member  

            Stay helpful, welcoming, and avoid sounding robotic or scripted.`,
          },
        ],
      },
      contents: contents,
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${config.geminiKey}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      log("INFO", `User message replied successfully.`);
      return aiResponse.trim();
    }

    throw new Error("Unable to Process Message. Please try again.");
  } catch (error) {
    log("ERROR", `Error replying user: ${error.message}`);
    return "Sorry, I couldn't process your message at the moment. Please try again later.";
  }
};

module.exports = { summarizeText, describeImage, replyUserMessage };
