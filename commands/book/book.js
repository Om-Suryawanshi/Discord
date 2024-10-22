const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
// const { googleBookApiKey } = require("../../config.json");
const { googleBookApiKey } = require('/etc/secrets/config.json');


const api_url = 'https://www.googleapis.com/books/v1/volumes';
const api_key = googleBookApiKey;

async function get_book_details(title) {
    const url = `${api_url}?q=intitle:${title}&key=${api_key}`;
    try {
        const resp = await axios.get(url);
        return resp.data.items[0] || null; // Return the first item from the API response, or null if no items found
    } catch (error) {
        console.error(`Error fetching data for title ${title}:`, error);
        return null; // Return null on error
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bookdetails')
        .setDescription('Get details about a specific book by title.')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Specify the title of the book.')
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log('Command executed.');
        const title = interaction.options.getString('title');
        const book = await get_book_details(title);

        if (!book) {
            await interaction.reply(`Sorry, I couldn't find any details for the book titled "${title}".`);
            return;
        }

        function createEmbed(book) {
            const volumeInfo = book.volumeInfo;
            const title = volumeInfo.title || 'No title';
            const authors = (volumeInfo.authors || ['Unknown Author']).join(', ');
            const description = volumeInfo.description || 'No description available';
            const publishedDate = volumeInfo.publishedDate || 'Unknown';
            const pageCount = volumeInfo.pageCount || 'Unknown';
            const language = volumeInfo.language || 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle(`${title} by ${authors}`)
                .setDescription(description)
                .setColor(0x0099ff)
                .addFields(
                    { name: 'Published Date', value: publishedDate, inline: true },
                    { name: 'Page Count', value: `${pageCount}`, inline: true },
                    { name: 'Language', value: language, inline: true }
                );

            if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                embed.setThumbnail(volumeInfo.imageLinks.thumbnail);
            }

            return embed;
        }

        const embed = createEmbed(book);
        await interaction.reply({ embeds: [embed] });
    }
};
