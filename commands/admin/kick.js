const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to be kicked')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')),
    async execute(interaction) {
        // Check if the user has administrator permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Retrieve the member and reason from the interaction options
        const member = interaction.options.getMember('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Kick the member
        await member.kick(reason);

        // Send a success message
        await interaction.reply({
            content: `${member.user.tag} has been kicked from the server. Reason: ${reason}`,
            ephemeral: false,
        });

        // Send a DM to the kicked member
        await member.send(`You have been kicked from the server because: ${reason}`);
    },
};
