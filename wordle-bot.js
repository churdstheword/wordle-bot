'use strict'

const puppeteer = require('puppeteer');
const WordleSolver = require('./wordle-solver');

class WordleBot {

    constructor() {
        this.viewport = { width: 390, height: 844 }
        this.wordleUrl = 'https://www.powerlanguage.co.uk/wordle/';
    }

    async solve() {

        console.log('Launching browser...');

        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ]
        });      

        this.page = await this.browser.newPage();
        await this.page.setViewport(this.viewport);
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36')
        await this.page.emulateTimezone('America/New_York');
        await this.page.goto(this.wordleUrl, { waitUntil: 'networkidle2' });

        // Click to hide the welcome popup
        await this.page.focus('body');
        await this.page.mouse.click(0, 0, { delay: 100 })

        console.log('Playing the game 😎 ...');

        const solver = new WordleSolver();

        let guess = '';
        let state = {};
        for (let i = 0; i < 6; i++) {
            guess = solver.getNextWord(guess, state);
            await this.makeGuess(guess);

            if (await this.checkBoardWinState()) {
                console.log('👑 WINNER 👑');

                // Need to wait for about 3 seconds for the animation
                await this.page.waitForTimeout(3000);

                // Click to hide the stats modal so we can get the winning screenshot
                await this.page.focus('body');
                await this.page.mouse.click(0, 0, { delay: 100 })
                await this.page.waitForTimeout(1000);

                break;
            }

            state = await this.getGameKeyboardState();
            solver.filterWords(guess, state);
        }

        console.log('Taking a screenshot...')
        await this.page.screenshot({ path: 'screenshot.png' });

        console.log('Closing Browser...');
        await this.browser.close();
    }

    async makeGuess(word) {
        await this.page.focus('body');
        await this.page.keyboard.type(word, { delay: 100 });
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
    }

    async checkBoardWinState() {

        return await this.page.evaluate(() => {
            const gameRows = document.querySelector("body > game-app")
                .shadowRoot.querySelectorAll("#board > game-row");
            for (const row of gameRows) {
                let score = 0;
                const gameTiles = row.shadowRoot.querySelectorAll("div > game-tile");
                for (const [index, tile] of gameTiles.entries()) {
                    const status = tile.getAttribute('evaluation');
                    if (status == 'correct') {
                        score++;
                    }
                }
                if (score == 5) {
                    return true;
                }
            }

            return false;
        });
    }

    async getGameKeyboardState() {
        return await this.page.evaluate(() => {
            const keyboard = {};
            const keyboardButtons = document.querySelector("body > game-app")
                .shadowRoot.querySelector("#game > game-keyboard")
                .shadowRoot.querySelectorAll("#keyboard button");
            for (const button of keyboardButtons) {
                const letter = button.textContent || '';
                const state = button.dataset.state || 'unknown';
                if (letter.length === 1) {
                    keyboard[letter] = state;
                }
            }
            return keyboard;
        });
    }

}

module.exports = WordleBot;