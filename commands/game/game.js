const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const { gameApiKey } = require('/etc/secrets/config.json');
// const { gameApiKey } = require('../../config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Get a game recommendation')
        .addStringOption(option =>
            option.setName('genre')
            .setDescription('The genre of the game')
            .setRequired(true)
            .addChoices({ name: 'Action', value: 'action' }, { name: 'Adventure', value: 'adventure' }, { name: 'RPG', value: 'role-playing-games-rpg' }, { name: 'Strategy', value: 'strategy' }, { name: 'Shooter', value: 'shooter' }, { name: 'Puzzle', value: 'puzzle' }, { name: 'Sports', value: 'sports' }, { name: 'Racing', value: 'racing' })
        ),
    async execute(interaction) {
        const genre = interaction.options.getString('genre');
        const apiKey = gameApiKey;
        const url = `https://api.rawg.io/api/games?genres=${genre}&key=${apiKey}&page=1&page_size=1`;

        const sendGameEmbed = async(page, update = false) => {
            try {
                const response = await axios.get(`${url}&page=${page}`);
                const data = response.data;

                if (!data.results.length) {
                    const embed = {
                        title: `No games found for genre: ${genre}`,
                    };
                    await interaction.reply({ embeds: [embed], components: [] });
                } else {
                    const game = data.results[0];
                    const stores = game.stores.map(store => {
                        switch (store.store.slug) {
                            case 'steam':
                                return `[Steam](https://store.steampowered.com/app/${store.store_id})`;
                            case 'epic-games':
                                return `[Epic Games](https://www.epicgames.com/store/en-US/p/${store.slug})`;
                            default:
                                return `[${store.store.name}](${store.url})`;
                        }
                    }).join(', ');

                    const embed = {
                        title: game.name,
                        description: game.description_raw || 'No description available.',
                        thumbnail: {
                            url: game.background_image,
                        },
                        fields: [{
                                name: 'Release Date',
                                value: game.released,
                                inline: true,
                            },
                            {
                                name: 'Rating',
                                value: game.rating.toString(),
                                inline: true,
                            },
                            {
                                name: 'Genres',
                                value: game.genres.map(genre => genre.name).join(', '),
                                inline: true,
                            },
                            {
                                name: 'Download Links',
                                value: stores || 'Not available',
                                inline: false,
                            },
                        ],
                        url: game.website || '',
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 1),
                            new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                        );

                    if (update) {
                        await interaction.editReply({ embeds: [embed], components: [row] });
                    } else {
                        await interaction.reply({ embeds: [embed], components: [row] });
                    }
                }
            } catch (error) {
                console.error(error);
                await interaction.reply('An error occurred while fetching the game.');
            }
        };

        try {
            await sendGameEmbed(1);

            const filter = i => ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            let page = 1;

            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    page = Math.max(1, page - 1);
                } else if (i.customId === 'next') {
                    page++;
                }

                await i.deferUpdate();
                await sendGameEmbed(page, true);
            });

            collector.on('end', async() => {
                await interaction.editReply({ components: [] });
            });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the game.');
        }
    },
};