const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meals')
        .setDescription('Meals (T_T)')
        .addStringOption(option =>
            option.setName('dish')
                .setDescription('The name of the dish')
                .setRequired(true)
        ),
    async execute(interaction) {
        const dish = interaction.options.getString('dish');
        const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${dish}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (!data.meals) {
                const embed = {
                    title: `Invalid dish: ${dish}`,
                };
                await interaction.reply({ embeds: [embed] });
            } else {
                const meal = data.meals[0];
                const ingredients = [];

                for (let i = 1; i <= 20; i++) {
                    const ingredient = meal[`strIngredient${i}`];
                    if (ingredient) {
                        ingredients.push(ingredient);
                    }
                }

                const embed = {
                    title: meal.strMeal,
                    thumbnail: {
                        url: meal.strMealThumb,
                    },
                    fields: [
                        {
                            name: 'Youtube',
                            value: meal.strYoutube,
                            inline: true,
                        },
                        {
                            name: 'Ingredients',
                            value: ingredients.join(', '),
                            inline: true,
                        },
                    ],
                };

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the meal.');
        }
    },
};
