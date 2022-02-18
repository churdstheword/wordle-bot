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

        data.forEach((count, letter, map) => {
            map.set(letter, count / this.words.length * 5);
        });

        return new Map([...data.entries()].sort((a, b) => {
            return b[1] - a[1];
        }));
    }

    getWordLetterPositionFrequency() {

        const data = [new Map(), new Map(), new Map(), new Map(), new Map()];

        // Initialize the collection
        const alphabet = this.getAlphabet();
        for (let i = 0; i < data.length; i++) {
            for (const letter of alphabet) {
                data[i].set(letter, 0);
            }
        }

        // Count how often each letter occurs in each position
        for (let word of this.words) {
            const letters = word.split('');
            for (const [i, letter] of letters.entries()) {
                let value = data[i].get(letter) || 0;
                data[i].set(letter, value + 1);
            }
        }

        // Transform each count into a probability
        for (const counts of data) {
            counts.forEach((count, letter, map) => {
                map.set(letter, count / this.words.length);
            });
        };

        // Sort each position by letter frequency
        for (let [index, value] of data.entries()) {
            data[index] = new Map([...value.entries()].sort((a, b) => {
                return b[1] - a[1];
            }));
        }

        return data;
    }

    getWordScore(word, state) {

        let score = 1;
        const lettersChosen = new Set();
        for (const [index, letter] of word.split('').entries()) {

            // Score based on known letters and frequency
            let usedLetterModifier = 1;
            if (this.letters.has(letter) || lettersChosen.has(letter)) {
                usedLetterModifier = 0.5;
            }

            let correctLetterModifier = 1;
            let lastGuess = state.boardState.reduce((a, b) => (b) ? b : a);
            let lastEvals = state.evaluations.reduce((a, b) => (b) ? b : a);
            if (lastGuess.split('').indexOf(letter) === index && lastEvals[index] === 'correct') {
                correctLetterModifier = 4;
            }

            let pScore = this.positional[index].get(letter);
            let gScore = this.globals.get(letter);

            score *= usedLetterModifier * correctLetterModifier * (pScore * gScore);

            lettersChosen.add(letter);
        }
        return score;
    }

    filterWords(state) {

        const required = new Set();
        const correct = ['', '', '', '', ''];
        const absent = [new Set(), new Set(), new Set(), new Set(), new Set()];
        const present = [new Set(), new Set(), new Set(), new Set(), new Set()];


        for (const [i, evals] of state.evaluations.entries()) {
            if (evals) {

                let lettersEvaluated = new Set();
                for (const [j, status] of evals.entries()) {

                    const letter = state.boardState[i][j];

                    switch (status) {
                        case 'correct':
                            required.add(letter);
                            correct[j] = letter;
                            present.map((item, k, arr) => {
                                item.delete(letter);
                            });
                            break;
                        case 'present':
                            if (!lettersEvaluated.has(letter)) {
                                present[j].add(letter);
                                required.add(letter);
                            }
                            break;
                        case 'absent':
                            if ((state.boardState[i].split(letter).length - 1 == 1)) {
                                absent.map((item) => {
                                    item.add(letter);
                                });
                            } else {
                                absent[j].add(letter);
                            }
                            break;
                        default:
                            break;
                    }

                    lettersEvaluated.add(letter);
                }
            }
        }

        this.words = this.words.filter(word => {

            let requiredCheck = 0;
            let checkedLetters = new Set();

            for (const [index, letter] of word.split('').entries()) {

                if (required.has(letter) && !checkedLetters.has(letter)) {
                    requiredCheck++;
                }

                // Reject any word with a letter in a spot we know cant be that letter
                if (present[index].size > 0 && present[index].has(letter)) {
                    return false;
                }

                // Reject any word that does not have the positional letter
                if (correct[index].length > 0 && correct[index] !== letter) {
                    return false;
                }

                // Reject any word that contains absent letters
                if (absent[index].has(letter)) {
                    return false;
                }

                checkedLetters.add(letter);

            }

            // Reject any word if it does not contain all the required letters
            if (requiredCheck != required.size) {
                return false;
            }

            return true;
        });

    }

    getNextWord(state) {

        this.filterWords(state);

        const scores = new Map();
        for (let word of this.words) {
            scores.set(word, this.getWordScore(word, state));
        }

        const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
        const word = sorted[0][0];

        for (const letter of word.split('')) {
            this.letters.add(letter);
        }

        return word;
    }

    getWords() {
        return fs.readFileSync(
            path.resolve(__dirname, 'dictionary.txt'),
            { encoding: 'utf8', flag: 'r' }
        ).split('\n');
    }

    getDayOffset() {
        const today = new Date().setHours(0, 0, 0, 0);
        const wordleEpoch = new Date(2021, 5, 19, 0, 0, 0, 0).setHours(0, 0, 0, 0);
        return Math.round((today - wordleEpoch) / 0x5265C00);
    }

    getShareButtonText(evals) {

        const offset = this.getDayOffset();
        const guessCount = evals.reduce((prev, curr) => (curr ? prev + 1 : prev), 0)
        const totalGuesses = 6;
        const board = evals.reduce((prev, curr) => {

            if (curr) {
                let rowText = '';
                for (const tileEvaluation of curr) {
                    switch (tileEvaluation) {
                        case 'correct':
                            rowText += '🟩';
                            break;
                        case 'present':
                            rowText += '🟨';
                            break;
                        case 'absent':
                            rowText += '⬜';
                            break;
                    }
                }

                return prev.concat('\n', rowText);
            }

            return prev;
        }, '');

        return `Wordle ${offset} ${guessCount}/${totalGuesses}`.concat('\n', board);

    }

}

module.exports = WordleSolver;