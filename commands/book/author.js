const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
// const { googleBookApiKey } = require("../../config.json");
const { googleBookApiKey } = require('/etc/secrets/config.json');


const api_url = 'https://www.googleapis.com/books/v1/volumes';
const api_key = googleBookApiKey;

async function get_books_by_author(author) {
    const url = `${api_url}?q=inauthor:${author}&key=${api_key}`;
    try {
        const resp = await axios.get(url);
        return resp.data.items || []; // Ensure to return an array of items from the API response
    } catch (error) {
        console.error(`Error fetching data for author ${author}:`, error);
        return []; // Return an empty array on error
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('searchbyauthor')
        .setDescription('Get books by a specific author.')
        .addStringOption(option =>
            option.setName('author')
                .setDescription('Specify the author name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const author = interaction.options.getString('author');
        const books = await get_books_by_author(author);

        if (books.length === 0) {
            await interaction.reply(`Sorry, I couldn't find any books by the author "${author}".`);
            return;
        }

        function createEmbed(books) {
            const embed = new EmbedBuilder()
                .setTitle(`Books by ${author}`)
                .setDescription('Here are some books by the author you specified:')
                .setColor(0x0099ff);

            books.forEach(book => {
                const title = book.volumeInfo.title || 'No title';
                const description = book.volumeInfo.description || 'No description available';

                embed.addFields({ name: title, value: description });
            });

            return embed;
        }

        const embed = createEmbed(books);
        await interaction.reply({ embeds: [embed] });
    }
};
