const { SlashCommandBuilder, Permissions, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages in the channel.')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of messages to delete')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has administrator permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Retrieve the limit from the interaction options
        const limit = interaction.options.getInteger('limit');

        // Defer the reply to prevent timeout issues
        await interaction.deferReply({ ephemeral: true });

        // Purge messages
        await interaction.channel.bulkDelete(limit);

        // Send a success message
        await interaction.followUp(`Successfully deleted ${limit} messages.`);
    },
};
