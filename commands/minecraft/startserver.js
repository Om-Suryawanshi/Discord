const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { Start_Url, Start_Cookie } = require('../../config.json');

// Create a CooldownManager to manage cooldowns for commands
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startserver')
        .setDescription('Starts the Aternos server.'),
    async execute(interaction) {
        try {
            const mincraft_role = interaction.member.roles.cache.has('1188050220420968529');
            if (mincraft_role) {
                const cooldownKey = interaction.commandName;
                // Check if the command is on cooldown
                if (cooldowns.has(cooldownKey)) {
                    const expirationTime = cooldowns.get(cooldownKey);
                    if (Date.now() < expirationTime) {
                        const remainingTime = (expirationTime - Date.now()) / 1000;
                        await interaction.reply(`Please wait ${remainingTime.toFixed(1)} seconds before using this command again.`);
                        return;
                    }
                }
                const response = await axios.get(
                    Start_Url,
                    {
                        headers: {
                            'Host': 'aternos.org',
                            'Cookie': Start_Cookie,
                            'Sec-Ch-Ua': '"Chromium";v="121", "Not A(Brand";v="99"',
                            'Sec-Ch-Ua-Mobile': '?0',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36',
                            'Sec-Ch-Ua-Arch': '""',
                            'Sec-Ch-Ua-Full-Version': '""',
                            'Sec-Ch-Ua-Platform-Version': '""',
                            'Sec-Ch-Ua-Full-Version-List': '',
                            'Sec-Ch-Ua-Bitness': '""',
                            'Sec-Ch-Ua-Model': '""',
                            'Sec-Ch-Ua-Platform': '"Windows"',
                            'Accept': '*/*',
                            'Sec-Fetch-Site': 'same-origin',
                            'Sec-Fetch-Mode': 'cors',
                            'Sec-Fetch-Dest': 'empty',
                            'Referer': 'https://aternos.org/server/',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Priority': 'u=1, i',
                        },
                    }
                );

                if (response.status === 200 && response.data.success) {
                    const cooldownDuration = 3 * 60 * 1000; // 3 minutes in milliseconds
                    cooldowns.set(cooldownKey, Date.now() + cooldownDuration);

                    const embed = {
                        color: 0x351C75,
                        title: 'Server Starting'
                    }

                    await interaction.reply({ embeds: [embed] });
                } else {
                    const errorMessage = response.data.error || 'Failed to start the server.';
                    await interaction.reply(errorMessage);
                }
            }
            else {
                await interaction.reply('You Dont have the minecraft role')
            }
        } catch (error) {
            console.error('Error sending server start request:', error);
            await interaction.reply('An error occurred while sending the server start request.');
        }
    },
};
