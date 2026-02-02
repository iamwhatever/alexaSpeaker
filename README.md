# Alexa ChatGPT Skill - Snowball

A personal AI voice assistant for Alexa, powered by OpenAI's GPT models. Ask "Snowball" any question and get conversational responses.

## Features

- **Voice AI assistant** - Talk to "Snowball" through Alexa
- **Fast responses** - Uses GPT-5-nano optimized for voice (1-2 second responses)
- **Daily token limit** - Configurable per-user limits to control costs
- **Automatic reset** - Token usage resets at midnight (timezone-aware)
- **Retry logic** - Automatic retries for reliable responses
- **Serverless** - AWS Lambda + DynamoDB, minimal cost

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

This skill uses `gpt-5-nano` by default for fast voice responses. You can change the model in `lambda/services/openaiService.js`:

| Model | Best For | Speed | Cost (per 1M tokens) |
|-------|----------|-------|---------------------|
| `gpt-5-nano` | **Recommended for voice** - fast responses | Fastest | $0.05 / $0.40 |
| `gpt-5-mini` | Better quality, slightly slower | Fast | $0.25 / $2.00 |
| `gpt-5` | Expert-level responses | Medium | $1.25 / $10.00 |
| `gpt-5.2` | Complex tasks, coding | Slower | $2.50 / $15.00 |

For voice assistants, faster is better - Alexa has an 8-second timeout.

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

Once deployed, say to your Alexa device:

```
"Alexa, open chat assistant"
→ "Hi, I'm Snowball. What would you like to know?"

"Snowball, what is the capital of France"
→ "The capital of France is Paris..."

"Snowball, tell me a fun fact about space"
→ "Here's a fun fact..."

"Stop"
→ "Goodbye."
```

### Supported Phrases

You can speak naturally:

- `what is {topic}` - "what is the moon"
- `tell me about {topic}` - "tell me about Paris"
- `who is {person}` - "who is Einstein"
- `why is {question}` - "why is the sky blue"
- `how do {question}` - "how do airplanes fly"
- `explain {topic}` - "explain gravity"
- `Snowball, {question}` - Also works with the assistant name

## Testing on Real Devices

No publishing needed! Development mode skills are available on your personal devices:

1. Your Echo/Alexa device must use the **same Amazon account** as your developer account
2. Skill must be set to **Development** in the Test tab
3. Just say: "Alexa, open chat assistant"

To verify, open the Alexa app → More → Skills & Games → Your Skills → **Dev** tab

## Keep Skill in Development Mode

**Important:** Keep this skill in Development mode permanently. Do NOT publish it.

If published:
- Anyone could use your OpenAI API key (your money!)
- Your AWS resources would serve the public
- Unexpected bills

Development mode = Only your Amazon account can use it.

## Alexa Limitations & Optimizations

| Limitation | How We Handle It |
|------------|------------------|
| **8-second timeout** | Use fast model (gpt-5-nano), retry logic |
| **~8000 char speech limit** | System prompt asks for short responses, truncation safety net |
| **Utterance patterns** | Need carrier phrases like "what is", "tell me about" |

### About Utterance Patterns

Alexa requires utterance patterns with "carrier phrases" - you can't just say anything freeform. We support many natural patterns like "what is X", "tell me about X", "why is X", etc. You can also use "Snowball, X" as a catch-all.

### Response Speed vs Quality

| Factor | Impact |
|--------|--------|
| **Model choice** | Biggest impact - gpt-5-nano is fastest |
| **System prompt** | Tells GPT to keep answers short |
| `max_completion_tokens` | Cost control only, doesn't speed up responses |

## Security Notes

- `samconfig.toml` is in `.gitignore` - never commit credentials
- For production, consider using [AWS Secrets Manager](DEPLOYMENT.md#production-security-with-aws-secrets-manager)
- OpenAI API key is stored as a Lambda environment variable with `NoEcho` enabled
- **Never share your API key** - if exposed, regenerate immediately at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Costs

| Service | Free Tier | Typical Cost |
|---------|-----------|--------------|
| AWS Lambda | 1M requests/month | $0 |
| DynamoDB | 25 GB storage | $0 |
| OpenAI gpt-5-nano | None | ~$0.20-0.60/month |

**Cost estimate with default settings (50,000 tokens/day limit):**
- Light usage: ~$0.10/month
- Heavy usage (hitting daily limit): ~$0.60/month

## Updating

After code changes:

```bash
sam build && sam deploy
```

## Troubleshooting

### "There was a problem with the skill's response"

1. **Check CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/<your-function-name> --since 10m
   ```

2. **Common causes:**
   - OpenAI API key invalid → Regenerate and update
   - Response too long → System prompt should limit this
   - Timeout → Model might be slow, consider gpt-5-nano

### Alexa Test Simulator Shows Empty JSON

- Try a **different browser** (Chrome works best)
- Open in **new tab**: [developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask)
- Make sure **Development** mode is selected (not "Off")

### Lambda Never Invoked (No CloudWatch Logs)

1. Verify endpoint ARN is saved in Alexa Console
2. Verify Lambda permission was added:
   ```bash
   aws lambda get-policy --function-name <your-function-name>
   ```
3. Skill ID in permission must match your actual skill

### Test Lambda Directly

```bash
aws lambda invoke \
  --function-name <your-function-name> \
  --payload '{"version":"1.0","session":{"new":true,"sessionId":"test","application":{"applicationId":"test"},"user":{"userId":"test"}},"request":{"type":"LaunchRequest","requestId":"test","timestamp":"2024-01-01T00:00:00Z","locale":"en-US"}}' \
  --cli-binary-format raw-in-base64-out \
  response.json && cat response.json
```

### Check Token Usage

```bash
aws dynamodb scan --table-name AlexaChatTokenUsage
```

## Cleanup

```bash
sam delete --stack-name alexa-chatgpt-skill
```

Then delete the Alexa skill from the Developer Console.

## License

MIT
