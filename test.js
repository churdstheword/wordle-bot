'use strict'

const WordleBot = require('./wordle-bot');

(async () => {
    const wordlebot = new WordleBot();
    const text = await wordlebot.solve();
})();