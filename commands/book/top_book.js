const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
// const { googleBookApiKey } = require("../../config.json");
const { googleBookApiKey } = require('/etc/secrets/config.json');


const api_url = 'https://www.googleapis.com/books/v1/volumes';
const api_key = googleBookApiKey;


async function get_top_books(genre) {
    const url = `${api_url}?q=subject:${genre}&orderBy=relevance&key=${api_key}`;
    try {
        const resp = await axios.get(url);
        return resp.data.items || []; // Ensure to return an array of items from the API response
    } catch (error) {
        console.error(`Error fetching top books for genre ${genre}:`, error);
        return []; // Return an empty array on error
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topbooks')
        .setDescription('Get top books from a specific genre.')
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('Specify the genre.')
                .addChoices(
                    { name: "Fantasy", value: "fantasy" },
                    { name: "Romance", value: "romance" },
                    { name: "Mystery", value: "mystery" },
                    { name: "Thriller", value: "thriller" },
                    { name: "Science Fiction", value: "science fiction" },
                    { name: "Non-Fiction", value: "non-fiction" }
                )
                .setRequired(true)
        ),
    async execute(interaction) {
        const genre = interaction.options.getString('genre');
        const books = await get_top_books(genre);

        if (books.length === 0) {
            await interaction.reply(`Sorry, I couldn't find any top books in the ${genre} genre.`);
            return;
        }

        function createEmbed(books) {
            const embed = new EmbedBuilder()
                .setTitle(`Top ${genre.charAt(0).toUpperCase() + genre.slice(1)} Books`)
                .setDescription('Here are some top books you might enjoy:')
                .setColor(0x0099ff);

            books.forEach(book => {
                const title = book.volumeInfo.title || 'No title';
                const authors = (book.volumeInfo.authors || ['Unknown Author']).join(', ');
                const description = book.volumeInfo.description || 'No description available';

                embed.addFields({ name: `${title} by ${authors}`, value: description });
            });

            return embed;
        }

        const embed = createEmbed(books);
        await interaction.reply({ embeds: [embed] });
    }
};
