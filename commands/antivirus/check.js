const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
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

// Function to check files with VirusTotal
async function checkFileWithVirusTotal(filePath) {
    if (!canMakeApiRequest()) {
        console.warn(`Rate limit exceeded. Cannot check file.`);
        return null;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('apikey', virusTotalApiKey);

    const apiUrl = `https://www.virustotal.com/vtapi/v2/file/scan`;

    try {
        const response = await axios.post(apiUrl, form, {
            headers: form.getHeaders(),
        });
        trackApiRequest();
        return response.data;
    } catch (error) {
        console.error(`Error checking file: ${filePath}`, error);
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
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The file to check with VirusTotal.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        const file = interaction.options.getAttachment('file');
        
        if (!url && !file) {
            await interaction.reply('Please provide either a URL or a file to check.');
            return;
        }

        if (url) {
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

        if (file) {
            // Save the file locally to a temporary directory
            const filePath = path.join(__dirname, '../../temp', file.name);
            const fileStream = fs.createWriteStream(filePath);

            const download = await axios({
                method: 'get',
                url: file.url,
                responseType: 'stream',
            });

            download.data.pipe(fileStream);

            fileStream.on('finish', async () => {
                const result = await checkFileWithVirusTotal(filePath);
                fs.unlinkSync(filePath); // Clean up the temporary file after upload

                if (result && result.scan_id) {
                    await interaction.reply(`File uploaded and scanned. Scan ID: ${result.scan_id}`);
                } else {
                    await interaction.reply('Something went wrong while scanning the file.');
                }
            });
        }
    }
};
