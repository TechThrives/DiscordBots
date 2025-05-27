const axios = require("axios");
const cheerio = require("cheerio");

const scrapeWallpaper = async (url) => {
  try {

    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith("hdqwalls.com")) {
      throw new Error("Please provide a valid URL from hdqwalls.com only");
    }

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Title
    const title = $(".page-heading h1").text().trim();

    // Category is in the breadcrumb, second <li> contains <a> with category name
    const category = $(".breadcrumb li:nth-child(2) a").text().trim();

    // Tags
    const container = $(".wallpaper_detail").first();

    // Extract tags text inside the container
    const tags = [];
    container.find("a > li > span.btn-link").each((i, el) => {
      const tagText = $(el).text().replace(/,$/, "").trim();
      tags.push(tagText);
    });

    // Resolution
    const resolution = $("footer").find("a.btn-link_a").first().text().trim();

    // Size (MB)
    const dlOriginal = $("#dl_original").text().trim();
    const sizeMatch = dlOriginal.match(/\(([\d.]+MB)\)/);
    const size = sizeMatch ? sizeMatch[1] : "Unknown";

    // Extract download URL
    const downloadUrl = $("#dl_original").attr("href");

    return {
      title,
      category,
      resolution,
      size,
      tags,
      downloadUrl,
    };
  } catch (error) {
    console.error("Error scraping wallpaper:", error);
    throw error;
  }
};

module.exports = { scrapeWallpaper };
