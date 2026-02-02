const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AlexaChatTokenUsage';
const DAILY_LIMIT = parseInt(process.env.DAILY_TOKEN_LIMIT, 10) || 10000;
const DEFAULT_TIMEZONE = process.env.USER_TIMEZONE || 'America/Los_Angeles';

/**
 * Get today's date string in user's timezone
 */
function getTodayDateString(timezone) {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: timezone }); // Returns YYYY-MM-DD
}

/**
 * Get token usage record for a user
 */
async function getTokenUsage(userId) {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId }
    });

    try {
        const response = await docClient.send(command);
        return response.Item || null;
    } catch (error) {
        console.error('Error getting token usage:', error);
        throw error;
    }
}

/**
 * Update token usage for a user
 */
async function updateTokenUsage(userId, tokensUsed, timezone = DEFAULT_TIMEZONE) {
    const today = getTodayDateString(timezone);

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            userId,
            tokensUsed,
            resetDate: today,
            timezone,
            lastUpdated: new Date().toISOString()
        }
    });

    try {
        await docClient.send(command);
    } catch (error) {
        console.error('Error updating token usage:', error);
        throw error;
    }
}

/**
 * Check if user can make a request (hasn't exceeded daily limit)
 * Returns { allowed: boolean, tokensUsed: number, tokensRemaining: number }
 */
async function checkTokenLimit(userId) {
    const record = await getTokenUsage(userId);
    const timezone = record?.timezone || DEFAULT_TIMEZONE;
    const today = getTodayDateString(timezone);

    // If no record or different day, user starts fresh
    if (!record || record.resetDate !== today) {
        return {
            allowed: true,
            tokensUsed: 0,
            tokensRemaining: DAILY_LIMIT
        };
    }

    const tokensUsed = record.tokensUsed || 0;
    const tokensRemaining = Math.max(0, DAILY_LIMIT - tokensUsed);

    return {
        allowed: tokensUsed < DAILY_LIMIT,
        tokensUsed,
        tokensRemaining
    };
}

/**
 * Add tokens to user's daily usage
 * Handles day rollover automatically
 */
async function addTokens(userId, tokensToAdd) {
    const record = await getTokenUsage(userId);
    const timezone = record?.timezone || DEFAULT_TIMEZONE;
    const today = getTodayDateString(timezone);

    let currentTokens = 0;

    // Only carry over tokens if same day
    if (record && record.resetDate === today) {
        currentTokens = record.tokensUsed || 0;
    }

    const newTotal = currentTokens + tokensToAdd;
    await updateTokenUsage(userId, newTotal, timezone);

    return {
        tokensUsed: newTotal,
        tokensRemaining: Math.max(0, DAILY_LIMIT - newTotal),
        limitReached: newTotal >= DAILY_LIMIT
    };
}

/**
 * Set user's timezone preference
 */
async function setUserTimezone(userId, timezone) {
    const record = await getTokenUsage(userId);
    const tokensUsed = record?.tokensUsed || 0;
    const resetDate = record?.resetDate || getTodayDateString(timezone);

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            userId,
            tokensUsed,
            resetDate,
            timezone,
            lastUpdated: new Date().toISOString()
        }
    });

    await docClient.send(command);
}

module.exports = {
    checkTokenLimit,
    addTokens,
    getTokenUsage,
    setUserTimezone,
    DAILY_LIMIT
};
