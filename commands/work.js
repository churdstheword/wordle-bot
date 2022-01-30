'use strict'

const fs = require('fs');
const path = require('path');
const { access } = require('fs/promises');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const { MessageAttachment, MessageEmbed } = Discord;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription("Make Wordle Bot show its work!"),
    async execute(interaction) {

        await interaction.deferReply({ ephemeral: true });
        const date = new Date();
        let filename = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-') + '.png';
        const filepath = path.resolve(__dirname, '../screenshots/', filename);

        try {
            await access(filepath, fs.constants.R_OK);
            const file = new MessageAttachment(filepath);
            const embed = new MessageEmbed().setTitle('Solution').setImage('attachment://' + filename);
            await interaction.editReply({ embeds: [embed], files: [file] });
        } catch (error) {
            console.log(error);
            await interaction.editReply({ content: 'Wordle Bot may not have solved this puzzle yet!' });
        }

    },
};