'use strict'

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class WordleSolver {

    constructor() {
        this.letters = new Set();
        this.words = this.getWords();
        this.globals = this.getWordLetterFrequencyGlobally();
        this.positional = this.getWordLetterFrequencyByPosition();
    }

    getWordLetterFrequencyGlobally() {

        const data = new Map();

        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of alphabet) {
            data.set(letter, 0);
        }

        for (let word of this.words) {
            const letters = word.split('');
            for (const letter of letters) {
                let value = data.get(letter) || 0;
                data.set(letter, value + 1);
            }
        }
        return new Map([...data.entries()].sort((a, b) => {
            return a[0].localeCompare(b[0]);
        }));
    }

    getWordLetterFrequencyByPosition() {

        const data = [new Map(), new Map(), new Map(), new Map(), new Map()];

        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (let i = 0; i < data.length; i++) {
            for (const letter of alphabet) {
                data[i].set(letter, 0);
            }
        }

        for (let word of this.words) {
            const letters = word.split('');
            for (const [i, letter] of letters.entries()) {
                let value = data[i].get(letter) || 0;
                data[i].set(letter, value + 1);
            }
        }

        for (let [index, item] of data.entries()) {
            data[index] = new Map([...item.entries()].sort((a, b) => {
                return a[0].localeCompare(b[0]);
            }));
        }

        return data;
    }

    getWordScore(word, state = {}) {

        const defaults = {};
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (let letter of alphabet) {
            defaults[letter] = 'unknown';
        }

        state = _.merge({}, defaults, state);

        let score = 0;
        const lettersChosen = new Set();
        for (const [index, letter] of word.split('').entries()) {

            // Score based on known letters and frequency
            let hasBeenUsed = (this.letters.has(letter) || lettersChosen.has(letter));

            //@TODO: Rank words with correct letter positions higher
            score += (hasBeenUsed ? 0 : 1) * (this.positional[index].get(letter) + this.globals.get(letter))

            lettersChosen.add(letter);
        }
        return score;
    }

    makeBlindGuess() {

        const scores = new Map();
        for (let word of this.words) {
            scores.set(word, this.getWordScore(word));
        }

        const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
        const word = sorted[0][0];

        for (const letter of word.split('')) {
            this.letters.add(letter);
        }

        return word;
    }

    filterWords(state) {

        this.words = this.words.filter(word => {

            // Reject any word that contains absent letters
            for (const letter of word.split('')) {
                if (state[letter] == 'absent') {
                    return false;
                }
            }

            return true;
        });

    }

    makeEducatedGuess() {



        const scores = new Map();
        for (let word of this.words) {

            // Reduce the words list by known letter positions


            // Reduce the words list by present and absent letters

            scores.set(word, this.getWordScore(word, state));
        }
    }

    getWords() {
        return fs.readFileSync(
            path.resolve(__dirname, 'dictionary.txt'),
            { encoding: 'utf8', flag: 'r' }
        ).split('\n');
    }

}

module.exports = WordleSolver;