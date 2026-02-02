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

### Install Tools (macOS)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install awscli aws-sam-cli node

# Verify installations
aws --version
sam --version
node --version
```

For other platforms, see [AWS CLI Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [SAM CLI Install Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/iamwhatever/alexaSpeaker.git
cd alexaSpeaker
npm install
```

### 2. Configure AWS Credentials

If you haven't configured AWS CLI yet, run:

```bash
aws configure
```

Enter your AWS credentials:
- **AWS Access Key ID**: Your IAM user access key
- **AWS Secret Access Key**: Your IAM user secret key
- **Default region**: `us-east-1` (required for Alexa skills)
- **Default output format**: `json`

To get AWS access keys, create an IAM user in [AWS Console](https://console.aws.amazon.com/iam/) with `AdministratorAccess` permission.

### 3. Configure App Settings

Copy the example config and fill in your credentials:

```bash
cp samconfig.example.toml samconfig.toml
```

Edit `samconfig.toml` with your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys)):

```toml
parameter_overrides = [
    "OpenAIApiKey=sk-your-actual-openai-api-key",
    "DailyTokenLimit=50000",
    "UserTimezone=America/Los_Angeles"
]
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `OpenAIApiKey` | Your OpenAI API key ([get one here](https://platform.openai.com/api-keys)) | (required) |
| `DailyTokenLimit` | Max tokens per user per day | `50000` |
| `UserTimezone` | Timezone for daily reset | `America/Los_Angeles` |

### 4. Deploy

```bash
sam build
sam deploy
```

Save the **Lambda ARN** from the output - you'll need it for Alexa configuration.

### 5. Create Alexa Skill

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create a new Custom skill (name: "Chat Assistant", model: Custom, hosting: Provision your own)
3. In **JSON Editor**, paste contents of `skill-package/interactionModels/custom/en-US.json`
4. Click **Save Model** then **Build Model**
5. Go to **Endpoint**, select **AWS Lambda ARN**, paste your Lambda ARN
6. Copy your **Skill ID** (click "View Skill ID" at top)
7. Add Alexa permission to invoke your Lambda:

```bash
aws lambda add-permission \
  --function-name <your-lambda-function-name> \
  --statement-id alexa-skill \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com \
  --event-source-token <your-skill-id>
```

8. Test in the Alexa Developer Console **Test** tab

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
