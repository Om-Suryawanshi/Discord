const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
// const { googleBookApiKey } = require("../../config.json");
const { googleBookApiKey } = require('/etc/secrets/config.json');


const api_url = 'https://www.googleapis.com/books/v1/volumes';
const api_key = googleBookApiKey;

const TAGS_CHOICES = [
    { name: "Fantasy", value: "fantasy" },
    { name: "Romance", value: "romance" },
    { name: "Mystery", value: "mystery" },
    { name: "Thriller", value: "thriller" },
    { name: "Science Fiction", value: "science fiction" },
    { name: "Non-Fiction", value: "non-fiction" },
    { name: "Historical Fiction", value: "historical fiction" },
    { name: "Biography", value: "biography" },
    { name: "Self-Help", value: "self-help" },
    { name: "Horror", value: "horror" },
    { name: "Young Adult", value: "young adult" },
    { name: "Children's", value: "children" },
    { name: "Adventure", value: "adventure" },
    { name: "Poetry", value: "poetry" },
    { name: "Classic", value: "classic" },
    { name: "Graphic Novel", value: "graphic novel" },
    { name: "Humor", value: "humor" },
    { name: "Travel", value: "travel" },
    { name: "Cooking", value: "cooking" },
    { name: "Health", value: "health" },
    { name: "Religion", value: "religion" },
    { name: "Art", value: "art" }
];

async function get_books_by_genre(genre, startIndex = 0) {
    const url = `${api_url}?q=subject:${genre}&key=${api_key}&startIndex=${startIndex}`;
    try {
        const resp = await axios.get(url);
        return resp.data.items || []; // Ensure to return an array of items from the API response
    } catch (error) {
        console.error(`Error fetching data for genre ${genre}:`, error);
        return []; // Return an empty array on error
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Get book recommendations by genre.')
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Specify a tag for book recommendation.')
                .addChoices(...TAGS_CHOICES.map(choice => ({ name: choice.name, value: choice.value })))
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log('Command executed.');
        const genre = interaction.options.getString('tag');
        let startIndex = 0; // Initial start index for pagination
        let books = await get_books_by_genre(genre, startIndex);

        if (books.length === 0) {
            await interaction.reply(`Sorry, I couldn't find any books in the ${genre} genre.`);
            return;
        }

        async function sendPagination(embed) {
            await interaction.reply({ embeds: [embed] });
            const message = await interaction.fetchReply();
            console.log('Initial message sent.');

            // Add pagination buttons
            await message.react('⬅️');
            await message.react('➡️');
            console.log('Reactions added.');

            const filter = (reaction, user) => {
                console.log(`Filter: reaction - ${reaction.emoji.name}, user - ${user.id}`);
                return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
            };

            const collector = message.createReactionCollector({ filter });

            collector.on('collect', async (reaction, user) => {
                console.log(`Reaction collected: ${reaction.emoji.name} from user ${user.id}`);
                // Remove the reaction added by the user to keep the reactions consistent
                await reaction.users.remove(user);
                console.log(`Reaction removed from user ${user.id}`);

                if (reaction.emoji.name === '⬅️') {
                    startIndex = Math.max(0, startIndex - 10); // Adjust as needed
                } else if (reaction.emoji.name === '➡️') {
                    startIndex += 10; // Adjust as needed
                }

                // Fetch new set of books based on updated start index
                books = await get_books_by_genre(genre, startIndex);
                console.log(`Fetched new set of books. Start index: ${startIndex}`);
                const newEmbed = createEmbed(books);
                console.log('New embed created.');

                try {
                    await message.edit({ embeds: [newEmbed] });
                    console.log('Message edited with new books.');
                } catch (error) {
                    console.error('Error editing message:', error);
                }
            });

            collector.on('end', async (collected, reason) => {
                console.log(`Collector ended. Reason: ${reason}`);
                // Don't remove bot's reactions at the end
            });
        }

        function createEmbed(books) {
            const embed = new EmbedBuilder()
                .setTitle(`Recommendations for ${genre.charAt(0).toUpperCase() + genre.slice(1)} Books`)
                .setDescription('Here are some books you might enjoy:')
                .setColor(0x0099ff);

            books.forEach(book => {
                const title = book.volumeInfo.title || 'No title';
                const authors = (book.volumeInfo.authors || ['Unknown Author']).join(', ');
                const description = book.volumeInfo.description || 'No description available';

                console.log(`Adding book to embed: ${title} by ${authors}`);

                // Validate the data before adding it to the embed
                if (typeof title === 'string' && typeof authors === 'string' && typeof description === 'string') {
                    try {
                        embed.addFields({ name: `${title} by ${authors}`, value: description });
                    } catch (error) {
                        console.error('Error adding fields to embed:', error);
                    }
                } else {
                    console.warn('Invalid data detected, skipping this book:', { title, authors, description });
                }
            });

            return embed;
        }

        // Initial sending of embed with pagination
        const initialEmbed = createEmbed(books);
        await sendPagination(initialEmbed);
    }
};


// 1024 Chars not added need to add