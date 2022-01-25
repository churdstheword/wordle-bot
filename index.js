'use strict'

const express = require('express');
const WordleBot = require('./wordle-bot');
const WordleSolver = require('./wordle-solver');

(async () => {
    const wordlebot = new WordleBot();
    await wordlebot.solve();
})();


// const app = express();

// app.post("/solve", async (req, res) => {
//     const wordlebot = new WordleBot();
//     await wordlebot.solve();
//     res.send('Jobs Done!');
// });

// app.listen(3000, () => {
//     console.log("Server running on port 3000");
// })
