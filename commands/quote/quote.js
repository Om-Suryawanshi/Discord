const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get a random inspirational quote'),
    async execute(interaction) {
        try {
            const response = await axios.get('https://zenquotes.io/api/random');
            const quote = response.data[0];
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setDescription(`"${quote.q}"`)
                .setFooter({ text: `— ${quote.a}` });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('Error fetching quote. Try again later!');
        }
    },
};