const { SlashCommandBuilder } = require('@discordjs/builders');
const WordleBot = require('../wordle-bot')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solve')
        .setDescription('Solves todays puzzle!'),
    async execute(interaction) {

        console.log('Solve Command was executed');

        await interaction.deferReply({ ephemeral: true });
        const wordlebot = new WordleBot();
        await wordlebot.solve();
        await interaction.editReply(wordlebot.shareButtonText);

        // const file = new MessageAttachment(path.resolve(__dirname, 'screenshot.png'));
        // const embed = new MessageEmbed().setTitle('Solution').setImage('attachment://screenshot.png')
        // let server = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
        // let channel = server.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        // channel.send({ embeds: [embed], files: [file] });

    },
};