# Alexa ChatGPT Skill

An Alexa skill that connects to OpenAI's ChatGPT API, with daily token usage tracking per user.

## Features

- Voice-based ChatGPT interaction through Alexa
- Daily token limit per user (configurable)
- Automatic token reset at midnight (timezone-aware)
- Serverless architecture (AWS Lambda + DynamoDB)

## Architecture

```
User (Alexa) → Lambda → OpenAI API
                 ↓
              DynamoDB (token tracking)
```

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js](https://nodejs.org/) 18.x or later
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Amazon Developer Account](https://developer.amazon.com/) for Alexa skill

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd alexaSpeaker
npm install
```

### 2. Configure

Copy the example config and fill in your credentials:

```bash
cp samconfig.example.toml samconfig.toml
```

Edit `samconfig.toml`:

```toml
parameter_overrides = [
    "OpenAIApiKey=sk-your-actual-openai-api-key",
    "DailyTokenLimit=10000",
    "UserTimezone=America/Los_Angeles"
]
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `OpenAIApiKey` | Your OpenAI API key | (required) |
| `DailyTokenLimit` | Max tokens per user per day | `10000` |
| `UserTimezone` | Timezone for daily reset | `America/Los_Angeles` |

### 3. Deploy

```bash
sam build
sam deploy
```

Save the **Lambda ARN** from the output - you'll need it for Alexa configuration.

### 4. Create Alexa Skill

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create a new Custom skill
3. Import the interaction model from `skill-package/interactionModels/custom/en-US.json`
4. Set the endpoint to your Lambda ARN
5. Build and test

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed step-by-step instructions.

## Project Structure

```
├── lambda/
│   ├── index.js              # Lambda entry point
│   ├── handlers/             # Alexa intent handlers
│   │   ├── chatHandler.js    # Main chat logic
│   │   ├── launchHandler.js  # Skill launch
│   │   └── helpHandler.js    # Help/Stop/Cancel
│   ├── services/
│   │   ├── openaiService.js  # OpenAI API integration
│   │   └── tokenTracker.js   # DynamoDB token tracking
│   └── utils/
│       └── responses.js      # Response helpers
├── skill-package/            # Alexa skill definition
├── template.yaml             # AWS SAM template
├── samconfig.example.toml    # Config template (copy to samconfig.toml)
└── DEPLOYMENT.md             # Detailed deployment guide
```

## Configuration Files

| File | Purpose | Git |
|------|---------|-----|
| `samconfig.example.toml` | Template - copy and fill in | Tracked |
| `samconfig.toml` | Your actual config with credentials | Ignored |
| `template.yaml` | AWS infrastructure definition | Tracked |

## Usage

Once deployed and linked to your Alexa device:

```
"Alexa, open chat assistant"
"What is the capital of France?"
"Explain quantum computing"
"Help"
"Stop"
```

## Security Notes

- `samconfig.toml` is in `.gitignore` - never commit credentials
- For production, consider using [AWS Secrets Manager](DEPLOYMENT.md#production-security-with-aws-secrets-manager)
- OpenAI API key is stored as a Lambda environment variable with `NoEcho` enabled

## Costs

| Service | Free Tier | Typical Cost |
|---------|-----------|--------------|
| AWS Lambda | 1M requests/month | $0 |
| DynamoDB | 25 GB storage | $0 |
| OpenAI GPT-3.5 | None | ~$0.50-5/month |

## Updating

After code changes:

```bash
sam build && sam deploy
```

## Cleanup

```bash
sam delete --stack-name alexa-chatgpt-skill
```

Then delete the Alexa skill from the Developer Console.

## License

MIT
