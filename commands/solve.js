'use strict'

const { SlashCommandBuilder } = require('@discordjs/builders');
const WordleBot = require('../wordle-bot')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solve')
        .setDescription("Solve today's puzzle!"),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const wordlebot = new WordleBot();
        const text = await wordlebot.solve();
        await interaction.editReply(text);
    },
};