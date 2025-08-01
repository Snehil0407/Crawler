# AI Assistant Configuration Guide

This guide will help you configure the AI Assistant feature with Google's Gemini API.

## 🚀 Quick Setup

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (keep it secure!)

### Step 2: Configure Environment Variables

Create or update your `.env.local` file in the frontend directory:

```bash
# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_AI_PROVIDER=gemini
NEXT_PUBLIC_AI_MODEL=gemini-pro
NEXT_PUBLIC_AI_MAX_TOKENS=2048
NEXT_PUBLIC_AI_TEMPERATURE=0.7
```

### Step 3: Restart Your Application

```bash
cd frontend1
npm run dev
```

## 🔧 Advanced Configuration

### Available Models
- `gemini-pro` - Best for text generation and analysis
- `gemini-pro-vision` - For image analysis (future feature)

### Temperature Settings
- `0.0` - More deterministic, factual responses
- `0.7` - Balanced creativity and accuracy (recommended)
- `1.0` - More creative and varied responses

### Token Limits
- `1024` - Short responses
- `2048` - Medium responses (recommended)
- `4096` - Long, detailed responses

## 🛡️ Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Rotate API keys** regularly
4. **Monitor API usage** to detect anomalies

## 📊 Features Available

Once configured, the AI Assistant can:

- **Vulnerability Analysis**: Explain security issues in detail
- **Risk Assessment**: Prioritize vulnerabilities by severity
- **Remediation Guidance**: Provide step-by-step fixes
- **Code Examples**: Show secure coding practices
- **Best Practices**: Recommend security improvements

## 🔍 Example Questions

Try asking the AI Assistant:

- "What are the most critical vulnerabilities in this scan?"
- "How do I fix the SQL injection issues?"
- "Explain the XSS vulnerabilities found"
- "What security headers should I implement?"
- "Show me code examples for secure authentication"

## 🚨 Troubleshooting

### API Key Not Working
- Verify the key is correct and active
- Check if you have API quotas/billing enabled
- Ensure the key has proper permissions

### No Response from AI
- Check browser console for errors
- Verify environment variables are loaded
- Restart the development server

### Rate Limiting
- Implement request queuing if needed
- Consider upgrading your API plan
- Add delay between requests

## 💰 Cost Management

- Monitor your API usage in Google Cloud Console
- Set up billing alerts
- Consider implementing request caching
- Use appropriate token limits

## 🔄 Updates

The AI configuration system supports:
- Hot-swapping API keys without restart
- Multiple AI providers (future)
- Custom model parameters
- Response caching (future feature)

For more advanced configuration options, see the `aiConfig.ts` and `aiService.ts` files.
