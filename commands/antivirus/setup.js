const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up a logging channel for antivirus operations.')
        .addChannelOption(option =>
            option.setName('logchannel')
                .setDescription('The channel where phishing URL logs will be sent.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const logChannel = interaction.options.getChannel('logchannel');

        // Save the log channel ID to a file
        fs.writeFileSync('logChannelId.txt', logChannel.id);
        await interaction.reply(`Log channel has been set to: ${logChannel.name}`);
    }
};
