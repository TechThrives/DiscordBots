const { log } = require("./common");
const { MessageFlags } = require("discord.js");

const sendLargeTextToInteraction = async (interaction, content, options = {}) => {
  const {
    prefix = "",
    suffix = "",
    maxLength = 2000,
    chunkSize = 1900,
    useCodeBlock = false,
    splitBy = "\n",
    ephemeral = false,
  } = options;

  try {
    // Apply code block formatting if requested
    const formattedContent = useCodeBlock ? `\`\`\`\n${content}\n\`\`\`` : content;
    const fullText = prefix + formattedContent + suffix;

    // If content fits in one message, send it normally
    if (fullText.length <= maxLength) {
      const replyOptions = { content: fullText};
      if (ephemeral) {
        replyOptions.flags = MessageFlags.Ephemeral;
      }
      
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(replyOptions);
      } else {
        return await interaction.reply(replyOptions);
      }
    }

    // Content is too long, need to split it
    const chunks = splitTextIntoChunks(formattedContent, chunkSize, splitBy);

    // Send first chunk as reply/edit
    const firstChunk = prefix + chunks[0] + (chunks.length > 1 ? "" : suffix);
    const firstReplyOptions = { content: firstChunk, ephemeral };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(firstReplyOptions);
    } else {
      await interaction.reply(firstReplyOptions);
    }

    // Send remaining chunks as follow-ups
    for (let i = 1; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const chunk = chunks[i] + (isLastChunk ? suffix : "");
      await interaction.followUp({ content: chunk, ephemeral });
    }

    return { success: true, chunks: chunks.length };
  } catch (error) {
    log("ERROR", `Failed to send large text to interaction: ${error.message}`);

    // Try to send error message
    const errorMsg = "Failed to send message due to length or other issues.";
    const errorOptions = { content: errorMsg, ephemeral };
    
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorOptions);
      } else {
        await interaction.reply(errorOptions);
      }
    } catch (replyError) {
      log("ERROR", `Failed to send error message to interaction: ${replyError.message}`);
    }

    throw error;
  }
};

const sendLargeTextToMessage = async (message, content, options = {}) => {
  const {
    prefix = "",
    suffix = "",
    maxLength = 2000,
    chunkSize = 1900,
    useCodeBlock = false,
    splitBy = "\n",
    reply = false, // Whether to reply to the original message
  } = options;

  try {
    // Apply code block formatting if requested
    const formattedContent = useCodeBlock ? `\`\`\`\n${content}\n\`\`\`` : content;
    const fullText = prefix + formattedContent + suffix;

    // If content fits in one message, send it normally
    if (fullText.length <= maxLength) {
      if (reply) {
        return await message.reply(fullText);
      } else {
        return await message.channel.send(fullText);
      }
    }

    // Content is too long, need to split it
    const chunks = splitTextIntoChunks(formattedContent, chunkSize, splitBy);

    // Send first chunk
    const firstChunk = prefix + chunks[0] + (chunks.length > 1 ? "" : suffix);
    let firstMessage;
    
    if (reply) {
      firstMessage = await message.reply(firstChunk);
    } else {
      firstMessage = await message.channel.send(firstChunk);
    }

    // Send remaining chunks to the same channel
    const sentMessages = [firstMessage];
    for (let i = 1; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const chunk = chunks[i] + (isLastChunk ? suffix : "");
      const sentMessage = await message.channel.send(chunk);
      sentMessages.push(sentMessage);
    }

    return { success: true, chunks: chunks.length, messages: sentMessages };
  } catch (error) {
    log("ERROR", `Failed to send large text to message: ${error.message}`);

    // Try to send error message
    const errorMsg = "Failed to send message due to length or other issues.";
    try {
      if (reply) {
        await message.reply(errorMsg);
      } else {
        await message.channel.send(errorMsg);
      }
    } catch (replyError) {
      log("ERROR", `Failed to send error message to channel: ${replyError.message}`);
    }

    throw error;
  }
};

/**
 * Split text into chunks while preserving structure
 */
const splitTextIntoChunks = (text, maxChunkSize, splitBy = "\n") => {
  const chunks = [];

  // If text is shorter than max size, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }

  // Split by specified delimiter (lines, sentences, etc.)
  const parts = text.split(splitBy);
  let currentChunk = "";

  for (const part of parts) {
    const partWithDelimiter = part + splitBy;

    // If adding this part would exceed chunk size
    if ((currentChunk + partWithDelimiter).length > maxChunkSize) {
      // If current chunk has content, save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If single part is larger than chunk size, force split it
      if (partWithDelimiter.length > maxChunkSize) {
        const forceSplit = forceSplitLongText(partWithDelimiter, maxChunkSize);
        chunks.push(...forceSplit);
      } else {
        currentChunk = partWithDelimiter;
      }
    } else {
      currentChunk += partWithDelimiter;
    }
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
};

/**
 * Force split text that's too long even for a single chunk
 */
const forceSplitLongText = (text, maxSize) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + maxSize;
    chunks.push(text.substring(start, end));
    start = end;
  }

  return chunks;
};

module.exports = {
  sendLargeTextToInteraction,
  sendLargeTextToMessage,
  splitTextIntoChunks,
};