const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discord_profile')
        .setDescription('Displays the Discord profile of a user in the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Specify a user to view their profile (optional).')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = {
            title: user.username,
            description: user.toString(),
            color: 0x351C75,
            thumbnail: {
                url: user.displayAvatarURL({ dynamic: true }),
            },
            fields: [],
        };

        // Add 'Joined' field if 'joinedAt' is available
        if (user.joinedAt) {
            embed.fields.push({
                name: 'Joined',
                value: user.joinedAt.toLocaleString('en-US'),
                inline: true,
            });
        }

        // Add 'Registered' field if 'createdAt' is available
        if (user.createdAt) {
            embed.fields.push({
                name: 'Registered',
                value: user.createdAt.toLocaleString('en-US'),
                inline: true,
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
