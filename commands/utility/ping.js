const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
        // await interaction.reply({ content: 'Secret Pong!', ephemeral: true });
        // Secret reply
        // Wait and edit response
        // await wait(2_000);
		// await interaction.editReply('Pong again!');
        // wait and reply
        // await interaction.deferReply({ ephemeral: true });
        // await interaction.deferReply();
		// await wait(4_000);
		// await interaction.editReply('Pong!');
        // Followup 
        // await interaction.followUp('Pong again!');
        // Delete Reply
        // await interaction.reply('Pong!');
        // await interaction.deleteReply();
	},
};