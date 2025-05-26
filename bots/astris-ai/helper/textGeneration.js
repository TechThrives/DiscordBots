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
      generationConfig: {
        temperature: 0.3,
        topK: 32,
        topP: 1,
        maxOutputTokens: 500,
      },
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
      }
    );

    console.log(response.data.candidates);

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const summary = response.data.candidates[0].content.parts[0].text;
      log(`Text summarized successfully. Original length: ${text.length}, Summary length: ${summary.length}`);
      return summary.trim();
    }

    throw new Error("Failed to generate summary. Please try again.");
  } catch (error) {
    log("ERROR", `Error summarizing text: ${error.message}`);
    throw new Error("Failed to generate summary. Please try again.");
  }
};

module.exports = { summarizeText };
