const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get the current weather for a location.')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Enter the name of the city')
                .setRequired(true)),
    async execute(interaction) {
        const cityName = interaction.options.getString('location');
        const apiKey = '92076f156adf35fe2261d1ff77b24023';
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data.cod === '404') {
                return interaction.reply(`Location not found: ${data.message}`);
            }

            const temperature = (data.main.temp - 273.15).toFixed(1);
            const description = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
            const city = data.name;
            const country = data.sys.country;

            const embed = {
                title: `Weather for ${city}, ${country}`,
                description: `${description}\nTemperature: ${temperature}°C`,
                color: 0x351C75,
            };

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply('An error occurred while fetching the weather information');
        }
    },
};
