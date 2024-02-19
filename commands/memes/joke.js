const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

async function getJoke() {
    const url = "https://official-joke-api.appspot.com/random_joke";
    const response = await axios.get(url);
    const data = response.data;

    const embed = {
        color: 0x351C75,
        title: data["setup"],
        description: data["punchline"]
    };

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Dad Jokes'),
    async execute(interaction) {
        const joke = await getJoke(); // Don't forget to await the function call
        await interaction.reply({ embeds: [joke] });
    }
};
