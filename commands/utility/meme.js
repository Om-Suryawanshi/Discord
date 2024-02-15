const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const CHOICES = [
    { name: 'Random', value: 'random' },
    { name: 'Wholesome', value: 'wholesome' },
    { name: 'Memes', value: 'memes' },
    { name: 'Dank Memes', value: 'dankmemes' },
    { name: 'Me IRL', value: 'me_irl' },
    { name: 'Dark Memes PH', value: 'darkmemesph' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get memes for a laugh.')
        .addStringOption(option =>
            option.setName('meme_type')
                .setDescription('Type of meme (random, wholesome, memes, dankmemes, me_irl, DarkMemesPh)')
                .addChoices(...CHOICES.map(choice => ({ name: choice.name, value: choice.value })))
                .setRequired(false)),
    async execute(interaction) {
        const memeType = interaction.options.getString('meme_type') || 'random';

        const memeTypes = {
            'random': 'https://meme-api.com/gimme',
            'wholesome': 'https://meme-api.com/gimme/wholesomememes',
            'memes': 'https://meme-api.com/gimme/memes',
            'dankmemes': 'https://meme-api.com/gimme/dankmemes',
            'me_irl': 'https://meme-api.com/gimme/me_irl',
            'darkmemesph': 'https://meme-api.com/gimme/DarkMemesPh',
        };

        const memeTypeLower = memeType.toLowerCase();

        if (!(memeTypeLower in memeTypes)) {
            await interaction.reply('Invalid meme type. Available types: random, wholesome, memes, dankmemes, me_irl, DarkMemesPh');
            return;
        }

        const url = memeTypes[memeTypeLower];

        try {
            const response = await axios.get(url);
            const data = response.data;

            const embed = {
                color: 0x351C75,
                image: { url: data.url },
            };

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to fetch meme. Try again later.');
        }
    },
};
