const fs = require('fs');
const axios = require('axios');
const path = require('path');
// const { virusTotalApiKey } = require('../config.json');
const { virusTotalApiKey } = require('/etc/secrets/config.json');


let trustedDomainsPath = path.join(__dirname, '../trustedDomains.json');

let lookupQueue = []; // Stores timestamps of the last minute's lookups
let dailyLookups = 0;  // Stores the number of lookups today
const dailyLimit = 500; // Daily lookup limit
const minuteLimit = 4;  // Limit of 4 lookups per minute

// Helper function to clear lookups older than 1 minute
function clearOldLookups() {
    const now = Date.now();
    // Remove timestamps older than 60 seconds from the queue
    lookupQueue = lookupQueue.filter(timestamp => now - timestamp < 60000);
}

// Function to check whether we can make an API request based on rate limits
function canMakeApiRequest() {
    // Clear old entries in the lookup queue
    clearOldLookups();

    // Check if we exceed the minute or daily limit
    if (lookupQueue.length >= minuteLimit || dailyLookups >= dailyLimit) {
        return false;
    }

    return true;
}

// Function to track a successful API request
function trackApiRequest() {
    // Add current timestamp to the queue and increase daily lookups
    lookupQueue.push(Date.now());
    dailyLookups++;
}

// Function to reset the daily lookup count at midnight
function resetDailyLookups() {
    const now = new Date();
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;

    // Reset daily lookup count at midnight
    setTimeout(() => {
        dailyLookups = 0;
        resetDailyLookups();  // Recursively set the timer again for the next day
    }, timeUntilMidnight);
}

// Initialize daily lookup reset
resetDailyLookups();

// Function to check URLs using VirusTotal API
async function checkUrlWithVirusTotal(url) {
    if (!canMakeApiRequest()) {
        console.warn(`Rate limit exceeded. Cannot check URL: ${url}`);
        return null;
    }

    const apiUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${virusTotalApiKey}&resource=${encodeURIComponent(url)}`;

    try {
        const response = await axios.get(apiUrl);
        trackApiRequest(); // Track this successful API request
        return response.data;
    } catch (error) {
        console.error(`Error checking URL: ${url}`, error);
        return null;
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const urls = message.content.match(/\bhttps?:\/\/\S+/gi);
        if (urls) {
            const trustedDomains = JSON.parse(fs.readFileSync(trustedDomainsPath, 'utf-8'));

            for (const url of urls) {
                const domain = new URL(url).hostname;

                if (!trustedDomains.includes(domain)) {
                    const result = await checkUrlWithVirusTotal(url);
                    if (result && result.positives > 0) {
                        await message.delete();
                        // Log phishing link
                        const logChannelId = fs.existsSync('logChannelId.txt') ? fs.readFileSync('logChannelId.txt', 'utf-8') : null;
                        if (logChannelId) {
                            const logChannel = await client.channels.fetch(logChannelId);
                            logChannel.send(`Phishing link deleted: ${url} (Sent by: ${message.author.tag})`);
                        }
                    } else if (result && result.positives === 0) {
                        // Add domain to trusted list
                        trustedDomains.push(domain);
                        fs.writeFileSync(trustedDomainsPath, JSON.stringify(trustedDomains, null, 2));
                    }
                }
            }
        }
    }
};
