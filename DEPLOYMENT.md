# Deployment Guide - Alexa ChatGPT Skill

## Prerequisites

### 1. Install Required Tools

```bash
# Install AWS CLI
brew install awscli

# Install AWS SAM CLI
brew install aws-sam-cli

# Install Node.js (if not already installed)
brew install node

# Verify installations
aws --version
sam --version
node --version
```

### 2. Create Required Accounts

| Account | Purpose | URL |
|---------|---------|-----|
| AWS Account | Hosts Lambda + DynamoDB | https://aws.amazon.com |
| Amazon Developer Account | Registers Alexa skill | https://developer.amazon.com |
| OpenAI Account | API access for ChatGPT | https://platform.openai.com |

### 3. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy and save the key (starts with `sk-`)

### 4. Configure AWS Credentials

```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-1` (required for Alexa skills)
- **Default output format**: `json`

---

## Step 1: Configure Your Settings

Copy the example config file and fill in your credentials:

```bash
cp samconfig.example.toml samconfig.toml
```

Edit `samconfig.toml` and update:

```toml
parameter_overrides = [
    "OpenAIApiKey=sk-your-actual-openai-api-key",
    "DailyTokenLimit=10000",
    "UserTimezone=America/Los_Angeles"
]
```

| Parameter | Description | Example |
|-----------|-------------|---------|
| `OpenAIApiKey` | Your OpenAI API key | `sk-proj-abc123...` |
| `DailyTokenLimit` | Max tokens per user per day | `10000` |
| `UserTimezone` | Timezone for daily reset | `America/Los_Angeles` |

**Security Note:** `samconfig.toml` is in `.gitignore` and will not be committed. For production, consider using [AWS Secrets Manager](#production-security-with-aws-secrets-manager).

---

## Step 2: Install Dependencies

```bash
cd /Users/zejiangguo/workplace/alexaSpeaker
npm install
```

---

## Step 3: Build the SAM Application

```bash
sam build
```

Expected output:
```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

---

## Step 4: Deploy to AWS

Deploy with a single command (reads config from `samconfig.toml`):

```bash
sam deploy
```

**First-time deployment** will prompt you to confirm the changeset. Type `y` to proceed.

### Save the Lambda ARN

After deployment, note the output:
```
Key                 AlexaSpeakerFunctionArn
Value               arn:aws:lambda:us-east-1:123456789:function:alexa-chatgpt-skill-AlexaSpeakerFunction-XXXXX
```

**Copy this ARN - you'll need it for Alexa skill configuration.**

---

## Step 5: Create Alexa Skill

### 5.1 Create the Skill

1. Go to https://developer.amazon.com/alexa/console/ask
2. Click **Create Skill**
3. Enter:
   - **Skill name**: `Chat Assistant`
   - **Primary locale**: `English (US)`
   - **Model**: `Custom`
   - **Hosting**: `Provision your own`
4. Click **Create skill**
5. Choose **Start from Scratch** template
6. Click **Continue with template**

### 5.2 Configure Interaction Model

1. In left sidebar, click **Interaction Model** → **JSON Editor**
2. Delete all existing content
3. Copy and paste the contents of `skill-package/interactionModels/custom/en-US.json`:

```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "chat assistant",
      "intents": [
        {
          "name": "ChatIntent",
          "slots": [
            {
              "name": "query",
              "type": "AMAZON.SearchQuery"
            }
          ],
          "samples": [
            "{query}",
            "ask {query}",
            "tell me {query}",
            "I want to know {query}",
            "can you tell me {query}",
            "what is {query}",
            "explain {query}",
            "help me with {query}",
            "I have a question about {query}",
            "please answer {query}"
          ]
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.FallbackIntent",
          "samples": []
        }
      ],
      "types": []
    }
  }
}
```

4. Click **Save Model**
5. Click **Build Model** (wait for completion)

### 5.3 Configure Endpoint

1. In left sidebar, click **Endpoint**
2. Select **AWS Lambda ARN**
3. In **Default Region**, paste your Lambda ARN from Step 4
4. Click **Save Endpoints**

### 5.4 Add Alexa Trigger Permission to Lambda

```bash
# Replace XXXXX with your actual function suffix and SKILL_ID with your Alexa skill ID
aws lambda add-permission \
  --function-name alexa-chatgpt-skill-AlexaSpeakerFunction-XXXXX \
  --statement-id alexa-skill \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com \
  --event-source-token amzn1.ask.skill.YOUR-SKILL-ID
```

**To find your Skill ID:**
1. In Alexa Developer Console, go to your skill
2. Click **View Skill ID** at the top

---

## Step 6: Test the Skill

### 6.1 Test in Alexa Developer Console

1. In left sidebar, click **Test**
2. Change dropdown from "Off" to **Development**
3. Type or say: `open chat assistant`
4. Then try: `what is the capital of France`

### 6.2 Test on Echo Device

Make sure your Echo device is linked to the same Amazon account as your developer account.

Say:
- "Alexa, open chat assistant"
- Then ask any question

### 6.3 Check CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/lambda/alexa-chatgpt-skill-AlexaSpeakerFunction-XXXXX --follow
```

### 6.4 Check DynamoDB Token Usage

```bash
aws dynamodb scan --table-name AlexaChatTokenUsage
```

---

## Verification Checklist

| Test | Expected Result |
|------|-----------------|
| "Open chat assistant" | "Ready." |
| Ask a question | ChatGPT response + reprompt |
| Stay silent after response | "Still here." (after 8 sec) |
| Stay silent again | "Let me know if you need anything else." |
| Stay silent third time | "Goodbye." (session ends) |
| "Help" | Help message explaining how to use |
| "Stop" or "Cancel" | "Goodbye." (session ends) |
| Exceed 10,000 tokens | "You've reached your daily limit..." |

---

## Troubleshooting

### "There was a problem with the requested skill's response"

1. Check CloudWatch logs for errors
2. Verify Lambda has correct environment variables
3. Ensure OpenAI API key is valid

### "Skill not found"

1. Ensure skill is in Development mode (Test tab)
2. Check you're using the same Amazon account on Echo device

### Token limit not working

1. Check DynamoDB table has entries
2. Verify DAILY_TOKEN_LIMIT is set to 10000

### OpenAI errors

1. Verify API key is correct
2. Check you have API credits at https://platform.openai.com/usage

---

## Updating the Skill

After making code changes:

```bash
cd /Users/zejiangguo/workplace/alexaSpeaker
sam build && sam deploy
```

---

## Cleanup (Delete Everything)

```bash
# Delete the CloudFormation stack (Lambda + DynamoDB)
sam delete --stack-name alexa-chatgpt-skill

# Then manually delete the Alexa skill in developer console
```

---

## Cost Summary

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|------------------------|
| AWS Lambda | 1M requests/month | $0 (typical usage) |
| DynamoDB | 25 GB storage | $0 (typical usage) |
| OpenAI GPT-3.5 | None | ~$0.50-5 depending on usage |

---

## Production Security with AWS Secrets Manager

For production deployments, consider storing your OpenAI API key in AWS Secrets Manager instead of environment variables:

### 1. Create Secret

```bash
aws secretsmanager create-secret \
  --name alexa-chatgpt/openai-api-key \
  --secret-string "sk-your-actual-api-key"
```

### 2. Grant Lambda Access

Add to `template.yaml` under Policies:

```yaml
- Version: '2012-10-17'
  Statement:
    - Effect: Allow
      Action:
        - secretsmanager:GetSecretValue
      Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:alexa-chatgpt/*'
```

### 3. Fetch Secret in Code

Update `lambda/services/openaiService.js` to fetch from Secrets Manager at runtime.

**Benefits:**
- Credentials never in config files
- Automatic encryption
- Audit logging
- Easy key rotation

---

## Quick Reference Commands

```bash
# Build
sam build

# Deploy
sam deploy

# View logs
aws logs tail /aws/lambda/alexa-chatgpt-skill-AlexaSpeakerFunction-XXXXX --follow

# Check token usage
aws dynamodb scan --table-name AlexaChatTokenUsage

# Update configuration (edit samconfig.toml, then redeploy)
sam build && sam deploy
```
