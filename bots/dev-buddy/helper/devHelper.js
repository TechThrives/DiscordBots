const axios = require("axios");
const { decode } = require("html-entities");
const { log } = require("../utils/common");
const config = require("../config");

const formatHtmlToPrompt = (htmlString) => {
  const cleaned = htmlString
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  return decode(cleaned);
};

const leetCodeDaily = async () => {
  try {
    const body = {
      query: `
        query questionOfToday {
            activeDailyCodingChallengeQuestion {
                date
                link
                question {
                    questionId
                    questionFrontendId
                    title
                    titleSlug
                    difficulty
                    topicTags { name }
                    content
                }
            }
        }
      `,
    };
    const response = await axios.post(`https://leetcode.com/graphql`, body);
    const data = response.data?.data;

    if (!data.activeDailyCodingChallengeQuestion) {
      throw new Error("No active daily coding challenge question found.");
    }

    return {
      id: data.activeDailyCodingChallengeQuestion.question.questionId,
      frontendId: data.activeDailyCodingChallengeQuestion.question.questionFrontendId,
      date: data.activeDailyCodingChallengeQuestion.date,
      title: data.activeDailyCodingChallengeQuestion.question.title,
      link: `https://leetcode.com${data.activeDailyCodingChallengeQuestion.link}`,
      titleSlug: data.activeDailyCodingChallengeQuestion.question.titleSlug,
      difficulty: data.activeDailyCodingChallengeQuestion.question.difficulty,
      topicTags: data.activeDailyCodingChallengeQuestion.question.topicTags.map((tag) => tag.name),
      content: formatHtmlToPrompt(data.activeDailyCodingChallengeQuestion.question.content),
    };
  } catch (error) {
    console.error("Error fetching website info:", error);
    throw new Error("Failed to fetch website info.");
  }
};

const solveLeetCode = async (titleSlug) => {
  try {
    const body = {
      query: `
            query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) { 
                    questionId
                    questionFrontendId
                    title
                    titleSlug
                    difficulty
                    topicTags { name }
                    content
                    codeSnippets {
                        lang
                        langSlug
                        code
                    }
                }
            }
        `,
      variables: { titleSlug: titleSlug },
    };
    const response = await axios.post(`https://leetcode.com/graphql`, body);
    const data = response.data?.data;

    if (!data.question) {
      throw new Error("LeetCode problem not found.");
    }

    const systemPrompt = `You are an expert competitive programmer and software engineer.
    The user will provide:
    - A LeetCode problem description.
    - Base code templates in C++, Java, and Python.

    Your task is to:
    1. Read and understand the problem carefully.
    2. Implement a correct and efficient solution for the problem.
    3. Use the provided base code for each language.
    4. Return **three complete solutions**, one in each of the following languages:
    - **C++**
    - **Java**
    - **Python**

    **Requirements:**
    - Only modify inside the appropriate method or class provided in the base code.
    - Keep the function/class names and method signatures exactly as given.
    - Follow idiomatic practices for each language.
    - Ensure the logic is correct and optimized.
    - Do not add explanation unless specifically requested.

    Respond only with code blocks for each language, clearly labeled.`;

    const generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          cpp: {
            type: "string",
            description: "C++ solution code",
          },
          java: {
            type: "string",
            description: "Java solution code",
          },
          python: {
            type: "string",
            description: "Python solution code",
          },
        },
        required: ["cpp", "java", "python"],
      },
    };

    const prompt = `LeetCode problem:\n${formatHtmlToPrompt(data.question.content)}\n\nBase code templates for each language:\n**C++:**\n${formatHtmlToPrompt(data.question.codeSnippets[0].code)}\n\n**Java:**\n${formatHtmlToPrompt(data.question.codeSnippets[1].code)}\n\n**Python:**\n${formatHtmlToPrompt(data.question.codeSnippets[2].code)}`;

    const solution = await aiResponse(systemPrompt, prompt, generationConfig);

    if (!solution) {
      throw new Error("Failed to solve LeetCode question");
    }

    const parsedSolution = JSON.parse(solution);

    return {
      id: data.question.questionId,
      frontendId: data.question.questionFrontendId,
      title: data.question.title,
      link: `https://leetcode.com/problems/${data.question.titleSlug}`,
      titleSlug: data.question.titleSlug,
      difficulty: data.question.difficulty,
      topicTags: data.question.topicTags.map((tag) => tag.name),
      content: formatHtmlToPrompt(data.question.content),
      solution: parsedSolution,
    };
  } catch (error) {
    console.error("Error solving LeetCode question:", error);
    throw new Error(error.message || "Failed to solve LeetCode question");
  }
};

const aiResponse = async (systemPrompt, prompt, generationConfig) => {
  try {
    const body = {
      system_instruction: {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: generationConfig,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiKey}`,
      body,
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      log("INFO", `User message replied successfully.`);
      return aiResponse.trim();
    }

    throw new Error("Unable to fetch AI response. Please try again.");
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to fetch AI response.");
  }
};

module.exports = { leetCodeDaily, solveLeetCode, aiResponse };
