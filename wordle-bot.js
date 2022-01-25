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
        await this.page.goto(this.wordleUrl, { waitUntil: 'networkidle2' });

        // Click to hide the welcome popup
        await this.page.focus('body');
        await this.page.mouse.click(0, 0, { delay: 100 })

        console.log('Playing the game 😎 ...');

        const solver = new WordleSolver();

        await this.makeGuess(solver.makeBlindGuess());
        solver.filterWords(await this.getGameKeyboardState());
        
        await this.makeGuess(solver.makeBlindGuess());
        solver.filterWords(await this.getGameKeyboardState());

        await this.makeGuess(solver.makeBlindGuess());
        solver.filterWords(await this.getGameKeyboardState());

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