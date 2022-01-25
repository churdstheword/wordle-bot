'use strict'

const express = require('express');
const WordleBot = require('./wordle-bot');

const app = express();

app.get("/screenshot.png", (req, res) => {
    res.sendFile('/app/screenshot.png');
});

app.get("/solve", async (req, res) => {
    const wordlebot = new WordleBot();
    await wordlebot.solve();
    res.send('<html><body><h1>Solution:</h1><div><img style="widgth: 60%"src="screenshot.png"></div></body></html>');
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});