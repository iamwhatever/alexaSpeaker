# Alexa ChatGPT Skill with Daily Token Limit

## Overview
Build an Alexa skill that connects to ChatGPT with:
- Conversational flow with reprompts (24 seconds total wait time)
- Hard daily token limit of 10,000 tokens
- Complete block when limit reached, reset at midnight local time

## Architecture

```
Alexa → AWS Lambda → OpenAI API
              ↓
         DynamoDB (token tracking)
```

## Project Structure

```
alexaSpeaker/
├── lambda/
│   ├── index.js              # Main Lambda handler
│   ├── handlers/
│   │   ├── launchHandler.js      # "open chat assistant"
│   │   ├── chatHandler.js        # Main chat intent
│   │   ├── helpHandler.js        # Help intent
│   │   └── sessionEndedHandler.js
│   ├── services/
│   │   ├── openaiService.js      # ChatGPT API calls
│   │   └── tokenTracker.js       # DynamoDB token tracking
│   └── utils/
│       └── responses.js          # Response builders
├── skill-package/
│   └── interactionModels/
│       └── custom/
│           └── en-US.json    # Alexa interaction model
├── package.json
├── template.yaml             # SAM template (Lambda + DynamoDB)
└── .env.example              # Environment variables template
```

## Implementation Details

### 1. Token Tracking (DynamoDB)
- **Table**: `AlexaChatTokenUsage`
- **Primary Key**: `userId` (Alexa user ID)
- **Attributes**:
  - `tokensUsed`: Number (daily count)
  - `resetDate`: String (YYYY-MM-DD in user's timezone)
  - `timezone`: String (user's timezone, default: America/Los_Angeles)

**Logic**:
```javascript
// On each request:
1. Get current record for userId
2. If resetDate !== today → reset tokensUsed to 0
3. If tokensUsed >= 10000 → block with "daily limit reached" message
4. After ChatGPT response → add tokens used (prompt + completion)
5. Update DynamoDB
```

### 2. Lambda Handler Flow
```
LaunchRequest → "Ready."
ChatIntent (user speaks) →
  1. Check token limit
  2. If over limit → "You've reached your daily limit. Try again tomorrow."
  3. Call OpenAI API
  4. Track tokens used
  5. Return response + reprompt "Still here."
  6. Set repromptCount = 0

SessionResumedRequest (reprompt timeout) →
  repromptCount == 0 → "Still here." → set to 1
  repromptCount == 1 → "Let me know if you need anything else." → set to 2
  repromptCount == 2 → "Goodbye." → end session
```

### 3. Key Files Created

| File | Purpose | Status |
|------|---------|--------|
| `lambda/index.js` | Alexa SDK entry point, routes intents | ✅ Done |
| `lambda/services/tokenTracker.js` | DynamoDB operations for token limits | ✅ Done |
| `lambda/services/openaiService.js` | OpenAI API integration | ✅ Done |
| `lambda/handlers/chatHandler.js` | Main conversation logic with reprompts | ✅ Done |
| `lambda/handlers/launchHandler.js` | Launch request handler | ✅ Done |
| `lambda/handlers/helpHandler.js` | Help intent handler | ✅ Done |
| `lambda/handlers/sessionEndedHandler.js` | Session ended handler | ✅ Done |
| `lambda/utils/responses.js` | Response builder helpers | ✅ Done |
| `skill-package/interactionModels/custom/en-US.json` | Alexa slot for free-form speech | ✅ Done |
| `template.yaml` | AWS SAM template for deployment | ✅ Done |

### 4. Environment Variables
```
OPENAI_API_KEY=sk-...
DAILY_TOKEN_LIMIT=10000
USER_TIMEZONE=America/Los_Angeles
DYNAMODB_TABLE=AlexaChatTokenUsage
```

### 5. Alexa Interaction Model
- **Invocation**: "chat assistant"
- **ChatIntent**: Captures any spoken text via `{query}` slot (AMAZON.SearchQuery)
- **Built-ins**: AMAZON.HelpIntent, AMAZON.StopIntent, AMAZON.CancelIntent

## Accounts Needed (Both Free)

| Account | Purpose | URL |
|---------|---------|-----|
| AWS Account | Hosts Lambda + DynamoDB | aws.amazon.com |
| Amazon Developer Account | Registers Alexa skill | developer.amazon.com |

## Deployment Steps (Using SAM)

### Prerequisites
```bash
# Install AWS SAM CLI
brew install aws-sam-cli

# Configure AWS credentials
aws configure
# (enter your AWS Access Key ID, Secret Access Key, region)
```

### Step 1: Deploy AWS Resources (Lambda + DynamoDB)
```bash
cd alexaSpeaker
npm install
sam build
sam deploy --guided
# SAM will:
# - Create DynamoDB table automatically
# - Create Lambda function automatically
# - Output the Lambda ARN (save this!)
```

### Step 2: Create Alexa Skill (One-time manual setup)
1. Go to developer.amazon.com → Alexa → Alexa Skills Kit
2. Create Skill → "Chat Assistant" → Custom → Provision your own
3. Copy our interaction model JSON into the JSON Editor
4. In Endpoint section → paste your Lambda ARN
5. Build Model → Test (enable testing)

### Step 3: Test
- In Alexa Developer Console: type "open chat assistant"
- Or on your Echo device: "Alexa, open chat assistant"

## Verification
1. **Token tracking**: Check DynamoDB table after conversations
2. **Limit enforcement**: Set limit to 100 tokens temporarily, verify block message
3. **Reprompt flow**: Stay silent after response, verify 3-stage timeout
4. **Reset**: Manually set `resetDate` to yesterday, verify counter resets

## Cost Estimate
- Lambda: Free tier covers typical usage
- DynamoDB: Free tier (25 GB storage, 25 WCU/RCU)
- OpenAI: ~$0.002 per 1K tokens (GPT-3.5-turbo)
