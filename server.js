"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const bibleApiKey = process.env.BIBLE_API_KEY;
const bibleId = "de4e12af7f28f599-02";
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const playlistIds = process.env.YOUTUBE_PLAYLIST_IDS
  ? process.env.YOUTUBE_PLAYLIST_IDS.split(",").map(id => id.trim())
  : [];

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB error:", err));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
const membersRoute = require("./routes/members");
app.use("/api/members", membersRoute);

// Utility functions
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function extractRandomVerse(htmlContent) {
  const verseRegex = /<span[^>]*data-verse="(\d+)"[^>]*>(.*?)<\/span>/g;
  let match;
  const verses = [];

  while ((match = verseRegex.exec(htmlContent)) !== null) {
    const verseNumber = match[1];
    let verseText = match[2];
    verseText = verseText.replace(/<[^>]+>/g, "").trim();

    if (verseText) {
      verses.push({ number: verseNumber, text: verseText });
    }
  }

  if (verses.length === 0) {
    const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();
    return {
      number: null,
      text: plainText.split(/[.?!]\s/)[0]
    };
  }

  return verses[getRandomInt(verses.length)];
}

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Light Bearers API is running" });
});

// Bible verse API
app.get("/api/bible-verse", async (req, res) => {
  try {
    const booksUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/books`;
    const booksRes = await fetch(booksUrl, {
      headers: { "api-key": bibleApiKey }
    });
    const booksData = await booksRes.json();

    if (!booksData.data || booksData.data.length === 0) {
      return res.status(500).json({ error: "No books found" });
    }

    const randomBook = booksData.data[getRandomInt(booksData.data.length)];

    const chaptersUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/books/${randomBook.id}/chapters`;
    const chaptersRes = await fetch(chaptersUrl, {
      headers: { "api-key": bibleApiKey }
    });
    const chaptersData = await chaptersRes.json();

    if (!chaptersData.data || chaptersData.data.length === 0) {
      return res.status(500).json({ error: "No chapters found for book" });
    }

    const randomChapter = chaptersData.data[getRandomInt(chaptersData.data.length)];

    const passageUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${randomChapter.id}`;
    const passageRes = await fetch(passageUrl, {
      headers: { "api-key": bibleApiKey }
    });
    const passageData = await passageRes.json();

    if (!passageData.data || !passageData.data.content) {
      return res.status(500).json({ error: "No passage content found" });
    }

    const randomVerse = extractRandomVerse(passageData.data.content);
    const reference = `${randomBook.name} ${randomChapter.number}:${randomVerse.number || "?"}`;

    res.json({
      status: 200,
      reference,
      verse: randomVerse.text
    });
  } catch (error) {
    console.error("Error fetching Bible verse:", error);
    res.status(500).json({ error: "Failed to fetch Bible verse." });
  }
});

// eBooks API using Gutendex
app.get("/api/ebooks", async (req, res) => {
  try {
    const response = await fetch(
      "https://gutendex.com/books/?topic=Christianity&languages=en"
    );
    const data = await response.json();

    const ebooks = data.results.slice(0, 10).map(book => ({
      id: book.id,
      title: book.title
    }));

    res.json({ ebooks });
  } catch (error) {
    console.error("Error fetching eBooks:", error);
    res.status(500).json({ error: "Failed to fetch eBooks." });
  }
});

// YouTube videos API
app.get("/api/videos", async (req, res) => {
  try {
    const maxResults = 5;

    const allPlaylists = await Promise.all(
      playlistIds.map(async (playlistId) => {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${youtubeApiKey}`
        );

        const data = await response.json();

        return {
          playlistId,
          videos: data.items?.map(item => ({
            title: item.snippet.title,
            videoId: item.snippet.resourceId.videoId,
            thumbnail: item.snippet.thumbnails?.medium?.url
          })) || []
        };
      })
    );

    res.json(allPlaylists);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// API 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});