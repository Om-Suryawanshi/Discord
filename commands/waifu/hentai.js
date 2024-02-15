const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const BASE_URL = 'https://api.waifu.im/search';
const TAGS = ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero'];

const TAGS_CHOICES = [
    { name: "Ass", value: "ass" },
    { name: "Hentai", value: "hentai" },
    { name: "Milf", value: "milf" },
    { name: "Oral", value: "oral" },
    { name: "Paizuri", value: "paizuri" },
    { name: "Ecchi", value: "ecchi" },
    { name: "Ero", value: "ero" }
];


async function getWaifuHentai(tag = null, gif = false) {
    if (!tag) {
        tag = TAGS[Math.floor(Math.random() * TAGS.length)];
    }

    let url = `${BASE_URL}/?included_tags=${tag}&is_nsfw=true`;

    if (gif) {
        url += "&gif=true";
    }

    try {
        const response = await axios.get(url);
        const jsonData = response.data;

        if ('images' in jsonData && jsonData.images) {
            const images = jsonData.images.map(img => img.url);
            return images;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching waifu hentai data:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hentai')
        .setDescription('Hentai (¬‿¬).')
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Specify a tag for hentai content (optional).')
                .addChoices(...TAGS_CHOICES.map(choice => ({ name: choice.name, value: choice.value })))
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('gif')
                .setDescription('Include GIFs in the response (default is false).')
                .setRequired(false)),
    async execute(interaction) {
        const tag = interaction.options.getString('tag');
        const gif = interaction.options.getBoolean('gif');

        const nsfw = Boolean(interaction.channel.nsfw)

        if (nsfw) {

            const hentaiImages = await getWaifuHentai(tag, gif);

            if (hentaiImages) {
                for (const imageUrl of hentaiImages) {

                    const embed = {
                        color: 0x351C75,
                        image: {
                            url: imageUrl,
                        },
                    };

                    await interaction.reply({ embeds: [embed] });
                }
            } else {
                await interaction.reply(`No hentai found for the specified tag: ${tag}`);
            }
        } else {
            const embed = {
                title: 'NSFW Channel Only',
                color: 0xFF0000,
            };

            await interaction.reply({ embeds: [embed] });
        }
    },
};
