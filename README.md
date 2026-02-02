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

### Get OpenAI API Key

**Note:** OpenAI API is separate from ChatGPT Plus subscription. API access requires separate billing.

1. Go to [platform.openai.com](https://platform.openai.com) (not chat.openai.com)
2. Sign up or log in
3. Go to **Settings** → **Billing** → Add payment method and add credits (minimum $5)
4. Go to **API Keys** → Click **Create new secret key**
5. Copy the key (starts with `sk-`) - it's only shown once!

## Model Choices

This skill uses `gpt-5-mini` by default. You can change the model in `lambda/services/openaiService.js`:

| Model | Best For | Speed | Cost (per 1M tokens) |
|-------|----------|-------|---------------------|
| `gpt-5-nano` | Simple chat, cheapest | Fastest | $0.05 / $0.40 |
| `gpt-5-mini` | **Recommended** - good balance | Fast | $0.25 / $2.00 |
| `gpt-5` | Expert-level responses | Medium | $1.25 / $10.00 |
| `gpt-5.2` | Complex tasks, coding | Slower | $2.50 / $15.00 |

To change the model, edit line 15 in `lambda/services/openaiService.js`:

```javascript
model: 'gpt-5-mini',  // Change to gpt-5-nano, gpt-5, or gpt-5.2
```

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

After deployment, note the output:
```
Key                 AlexaSpeakerFunctionArn
Value               arn:aws:lambda:us-east-1:123456789:function:alexa-chatgpt-skill-AlexaSpeakerFunction-AbCdEfGh
```

Save both:
- **Lambda ARN**: The full `arn:aws:lambda:...` value (for Alexa endpoint)
- **Function name**: The part after `function:` (e.g., `alexa-chatgpt-skill-AlexaSpeakerFunction-AbCdEfGh`)

### 5. Create Alexa Skill

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create a new Custom skill (name: "Chat Assistant", model: Custom, hosting: Provision your own)
3. In **JSON Editor**, paste contents of `skill-package/interactionModels/custom/en-US.json`
4. Click **Save Model** then **Build Model**
5. Go to **Endpoint**, select **AWS Lambda ARN**, paste your Lambda ARN
6. Copy your **Skill ID** (click "View Skill ID" at top)
7. Add Alexa permission to invoke your Lambda (run this locally - it updates AWS):

```bash
aws lambda add-permission \
  --function-name alexa-chatgpt-skill-AlexaSpeakerFunction-AbCdEfGh \
  --statement-id alexa-skill \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com \
  --event-source-token amzn1.ask.skill.xxxx-xxxx-xxxx
```

Replace:
- `alexa-chatgpt-skill-AlexaSpeakerFunction-AbCdEfGh` → your function name from step 4
- `amzn1.ask.skill.xxxx-xxxx-xxxx` → your Skill ID from step 6

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
| OpenAI gpt-5-mini | None | ~$1-3/month |

**Cost estimate with default settings (50,000 tokens/day limit):**
- Light usage: ~$0.50/month
- Heavy usage (hitting daily limit): ~$3/month

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
