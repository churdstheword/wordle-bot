'use strict'

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Discord = require('discord.js');

const { Client, Collection, Intents } = Discord;
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.resolve('./commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log('Ready!');
    let server = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
    let channel = server.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
    channel.send('WordleBot is reporting for duty!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
