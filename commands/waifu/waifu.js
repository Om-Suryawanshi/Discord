const { SlashCommandBuilder, Embed } = require('discord.js');
const axios = require('axios');

const BASE_URL_WAIFU = 'https://api.waifu.im/search';
const TAGS_WAIFU = ['marin-kitagawa', 'waifu', 'maid', 'mori-calliope', 'raiden-shogun', 'oppai', 'selfies', 'uniform'];

const TAGS_CHOICES = [
    { name: "Marin Kitagawa", value: "marin-kitagawa" },
    { name: "Waifu", value: "waifu" },
    { name: "Maid", value: "maid" },
    { name: "Mori Calliope", value: "mori-calliope" },
    { name: "Raiden Shogun", value: "raiden-shogun" },
    { name: "Oppai", value: "oppai" },
    { name: "Selfies", value: "selfies" },
    { name: "Uniform", value: "uniform" }
];

async function getWaifu(tag = null) {
    if (!tag) {
        tag = TAGS_WAIFU[Math.floor(Math.random() * TAGS_WAIFU.length)];
    }

    const url = `${BASE_URL_WAIFU}/?included_tags=${tag}`;

    try {
        const response = await axios.get(url);
        const imageData = response.data;

        if (imageData.images && imageData.images.length > 0) {
            const images = imageData.images.map(img => img.url);
            return images;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching waifu data:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('waifu')
        .setDescription('Sends waifu images based on specified tag.')
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Specify a tag for waifu content (optional).')
                .setChoices(...TAGS_CHOICES.map(choice => ({ name: choice.name, value: choice.value })))
                .setRequired(false)),
    async execute(interaction) {
        const tag = interaction.options.getString('tag');
        const waifuImages = await getWaifu(tag);

        if (waifuImages) {
            for (const imageUrl of waifuImages) {
                const embed = {
                    color: 0x351C75,
                    image: {
                        url: imageUrl,
                    }
                }
                // await interaction.reply(imageUrl);
                await interaction.reply({ embeds: [embed] });
            }
        } else {
            await interaction.reply(`No waifu images found for the specified tag: ${TAGS_CHOICES.name}`);
        }
    },
};
