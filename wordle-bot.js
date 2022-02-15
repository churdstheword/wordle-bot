'use strict'

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const WordleSolver = require('./wordle-solver');
const cache = require('node-file-cache');

class WordleBot {

    constructor(options) {

        this.browser = null;
        this.page = null;

        this.cache = cache.create({
            file: path.resolve(__dirname, 'cache.json'),
            life: 86400
        });

        // Defaults settings
        const defaults = {
            url: 'https://www.nytimes.com/games/wordle/index.html',
            viewport: { width: 390, height: 844 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
            timezone: 'America/New_York'
        };

        this.options = { ...defaults, ...options };

    };

    async openBrowser() {
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
    }

    async navigateToPage() {

        if (!this.browser) {
            return false;
        }

        console.log('Navigating to Page...');
        this.page = await this.browser.newPage();

        if (this.options.viewport) {
            await this.page.setViewport(this.options.viewport);
        }

        if (this.options.userAgent) {
            await this.page.setUserAgent(this.options.userAgent)
        }

        if (this.options.timezone) {
            await this.page.emulateTimezone(this.options.timezone);
        }

        await this.page.goto(this.options.url, { waitUntil: 'networkidle2' });
    }

    async takeScreenshot() {
        console.log('Taking a screenshot...');
        const date = new Date();
        let filename = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-') + '.png';
        await this.page.screenshot({
            path: path.resolve(__dirname, 'screenshots', filename),
            type: 'png'
        });
    }

    async closeBrowser() {
        console.log('Browser Shutdown...');
        await this.browser.close();
        this.browser = null;
    }

    async solve() {

        const date = new Date();
        let key = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
        let message = this.cache.get(key);

        if (!message) {

            try {

                await this.openBrowser();
                await this.navigateToPage();

                console.log('Playing the game 😎 ...');
                const solver = new WordleSolver();

                // Click to hide the welcome popup
                await this.cancelModal();

                // Get the inital board state
                this.state = await this.getGameState();

                while (this.state.rowIndex < 6 && this.state.gameStatus === "IN_PROGRESS") {

                    // Choose and guess the next word
                    let guess = solver.getNextWord(this.state);
                    console.log('Guessing: ', guess);
                    await this.makeGuess(guess);

                    // Get the new board state after guessing
                    await this.page.waitForTimeout(1000);
                    this.state = await this.getGameState();

                }

                // Wait for the animation and/or modal to show
                await this.page.waitForTimeout(2000);
                await this.cancelModal();
                await this.page.waitForTimeout(1000);

                // Determine our final message
                switch (this.state.gameStatus) {
                    case "WIN":
                        console.log('👑 Wordlebot is a WINNER 👑');
                        message = solver.getShareButtonText(this.state.evaluations);
                        break;
                    case "FAIL":
                        console.log('💩 Wordlebot is a LOSER! 💩');
                        message = solver.getShareButtonText(this.state.evaluations);
                        break;
                    default:
                        break;
                }

                // Cache the Message
                this.cache.set(key, message);

                await this.takeScreenshot();
                await this.closeBrowser();

            }
            catch (e) {
                console.log('There was an error solving the puzzle:' + e.message);
            }
        } else {
            console.log('Pulling message from cache!');
        }

        return message;
    }

    async cancelModal() {
        await this.page.focus('body');
        await this.page.mouse.click(0, 0, { delay: 100 });
    }

    async makeGuess(word) {
        await this.page.focus('body');
        await this.page.keyboard.type(word, { delay: 100 });
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
    }

    async getGameState() {

        return await this.page.evaluate(() => {

            const gameState = JSON.parse(window.localStorage['nyt-wordle-state']);

            let remaining = 0;
            if (gameState.boardState.indexOf('') !== -1) {
                remaining = gameState.boardState.length - gameState.boardState.indexOf('');
            }

            return {
                hash: window.wordle.hash,
                boardState: gameState.boardState,
                evaluations: gameState.evaluations,
                solution: gameState.solution,
                gameStatus: gameState.gameStatus,
                rowIndex: gameState.rowIndex,
                remaining: remaining
            };
        });
    }

}

module.exports = WordleBot;