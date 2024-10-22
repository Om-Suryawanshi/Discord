const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// const { virusTotalApiKey } = require('../../config.json');
const { virusTotalApiKey } = require('/etc/secrets/config.json');


let trustedDomainsPath = path.join(__dirname, '../../trustedDomains.json');
let lookupQueue = []; // Rate limiting per minute
let dailyLookups = 0;  // Rate limiting per day
const dailyLimit = 500; // Daily lookup limit
const minuteLimit = 4;  // Minute lookup limit

// Function to clear old lookups older than 60 seconds
function clearOldLookups() {
    const now = Date.now();
    lookupQueue = lookupQueue.filter(timestamp => now - timestamp < 60000);
}

// Check if we can make an API request
function canMakeApiRequest() {
    clearOldLookups();
    return lookupQueue.length < minuteLimit && dailyLookups < dailyLimit;
}

// Track API request
function trackApiRequest() {
    lookupQueue.push(Date.now());
    dailyLookups++;
}

// Function to reset daily lookups
function resetDailyLookups() {
    const now = new Date();
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;

    setTimeout(() => {
        dailyLookups = 0;
        resetDailyLookups(); // Set up for the next day
    }, timeUntilMidnight);
}

resetDailyLookups(); // Initialize daily limit reset

// Function to check URL with VirusTotal
async function checkUrlWithVirusTotal(url) {
    if (!canMakeApiRequest()) {
        console.warn(`Rate limit exceeded. Cannot check URL: ${url}`);
        return null;
    }

    const apiUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${virusTotalApiKey}&resource=${encodeURIComponent(url)}`;

    try {
        const response = await axios.get(apiUrl);
        trackApiRequest();
        return response.data;
    } catch (error) {
        console.error(`Error checking URL: ${url}`, error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Manually check a URL or file with VirusTotal.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL to check with VirusTotal.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        const domain = new URL(url).hostname;

        const trustedDomains = JSON.parse(fs.readFileSync(trustedDomainsPath, 'utf-8'));

        if (trustedDomains.includes(domain)) {
            await interaction.reply(`The domain \`${domain}\` is already trusted.`);
            return;
        }

        const result = await checkUrlWithVirusTotal(url);

        if (result && result.positives > 0) {
            await interaction.reply(`Phishing link detected! Do not trust this URL: ${url}`);
        } else if (result && result.positives === 0) {
            trustedDomains.push(domain);
            fs.writeFileSync(trustedDomainsPath, JSON.stringify(trustedDomains, null, 2));
            await interaction.reply(`The domain \`${domain}\` is clean and has been added to the trusted list.`);
        }
    }
};
