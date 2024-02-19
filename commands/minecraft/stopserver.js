const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const { Stop_Url, Stop_Cookie } = require('../../config.json');

const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stopserver')
        .setDescription('Stops the Aternos server. (Admin Only)'),
    async execute(interaction) {
        try {
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
            if (isAdmin) {
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
                    Stop_Url,
                    {
                        headers: {
                            'Host': 'aternos.org',
                            'cookie': Stop_Cookie,
                            'Sec-Ch-Ua': '"Chromium";v="121", "Not A(Brand";v="99"',
                            'Sec-Ch-Ua-Mobile': '?0',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36',
                            'Sec-Ch-Ua-Arch': '""',
                            'Sec-Ch-Ua-Full-Version': '""',
                            'Accept': '*/*',
                            'Sec-Ch-Ua-Platform-Version': '""',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Sec-Ch-Ua-Full-Version-List': '',
                            'Sec-Ch-Ua-Bitness': '""',
                            'Sec-Ch-Ua-Model': '""',
                            'Sec-Ch-Ua-Platform': '"Windows"',
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

                    await interaction.reply('Server stop request sent successfully.');
                } else {
                    const errorMessage = response.data.error || 'Failed to stop the server.';
                    await interaction.reply(errorMessage);
                }
            }
            else {
                await interaction.reply('Not An admin');
            }
        } catch (error) {
            console.error('Error sending server stop request:', error);
            await interaction.reply('An error occurred while sending the server stop request.');
        }
    },
};
