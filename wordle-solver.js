'use strict'

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class WordleSolver {

    constructor() {
        this.letters = new Set();
        this.words = this.getWords();
        this.globals = this.getWordLetterFrequency();
        this.positional = this.getWordLetterPositionFrequency();
    }

    getAlphabet() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        return letters.split('');
    }

    getWordLetterFrequency() {

        const data = new Map();

        const alphabet = this.getAlphabet();
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

    getWordLetterPositionFrequency() {

        const data = [new Map(), new Map(), new Map(), new Map(), new Map()];

        const alphabet = this.getAlphabet();
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

    getWordScore(word, prev = '', state = {}) {

        const defaults = {};
        const alphabet = this.getAlphabet();
        for (let letter of alphabet) {
            defaults[letter] = 'unknown';
        }

        state = _.merge({}, defaults, state);

        let score = 0;
        const lettersChosen = new Set();
        for (const [index, letter] of word.split('').entries()) {

            // Score based on known letters and frequency
            let usedLetterModifier = (this.letters.has(letter) || lettersChosen.has(letter)) ? 0.5 : 1;
            let correctLetterModifier = (index === prev.split('').indexOf(letter)) ? 1 : 4;

            let pScore = this.positional[index].get(letter);
            let gScore = this.globals.get(letter);

            score += usedLetterModifier * correctLetterModifier * (pScore + gScore);

            lettersChosen.add(letter);
        }
        return score;
    }

    filterWords(guess, state) {

        let required = [];
        for (const [letter, status] of Object.entries(state)) {
            if (status == 'present' || status == 'correct') {
                required.push(letter);
            }
        }

        const positional = [null, null, null, null, null];
        for (const [index, letter] of guess.split('').entries()) {
            if (state[letter] == 'correct') {
                positional[index] = letter;
            }
        }

        this.words = this.words.filter(word => {

            let requiredCheck = 0;
            for (const [index, letter] of word.split('').entries()) {

                if (required.includes(letter)) {
                    requiredCheck++;
                }

                // Reject any word that does not have the positional letter
                if (positional[index] !== null && positional[index] != letter) {
                    return false;
                }

                // Reject any word that contains absent letters
                if (state[letter] == 'absent') {
                    return false;
                }

            }

            // Reject any word if it does not contain all the required letters
            if (requiredCheck != required.length) {
                return false;
            }

            return true;
        });

    }

    getNextWord(prev, state) {

        const scores = new Map();
        for (let word of this.words) {
            scores.set(word, this.getWordScore(word, prev, state));
        }

        const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
        const word = sorted[0][0];

        for (const letter of word.split('')) {
            this.letters.add(letter);
        }

        console.log('Guessing: ', word);

        return word;
    }

    getWords() {
        return fs.readFileSync(
            path.resolve(__dirname, 'dictionary.txt'),
            { encoding: 'utf8', flag: 'r' }
        ).split('\n');
    }

}

module.exports = WordleSolver;