# Gemini API Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue: "Model not found for API version"

**Problem**: The model name or API endpoint is incorrect.

**Solutions**:
1. **Update model name** in `.env.local`:
   ```bash
   # Try these models in order:
   NEXT_PUBLIC_AI_MODEL=gemini-1.5-flash      # Recommended (fastest)
   NEXT_PUBLIC_AI_MODEL=gemini-1.5-pro       # More capable
   NEXT_PUBLIC_AI_MODEL=gemini-pro           # Legacy (may not work)
   ```

2. **Check API endpoint**: We use v1 (not v1beta):
   ```
   https://generativelanguage.googleapis.com/v1/models/
   ```

### Issue: "API key not working"

**Check your API key**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Verify the key is active and not expired
3. Check if billing is enabled (required for some quotas)
4. Ensure the key has proper permissions

### Issue: "Rate limiting or quota exceeded"

**Solutions**:
1. Check your quota in Google Cloud Console
2. Enable billing if using free tier limits
3. Add delays between requests
4. Upgrade your API plan

## 🧪 Testing Your Setup

### Method 1: Use Browser Console
```javascript
// Open browser console on your app and run:
fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Hello, test message" }] }]
  })
}).then(r => r.json()).then(console.log);
```

### Method 2: Test Available Models
```javascript
// List all available models:
fetch('https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY')
  .then(r => r.json())
  .then(data => {
    console.log('Available models:');
    data.models?.forEach(model => console.log(model.name));
  });
```

## 🔧 Configuration Files

### Correct .env.local format:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyASbE8jb-ulPE4KLsbVDrDugB17hlmkVns
NEXT_PUBLIC_AI_PROVIDER=gemini
NEXT_PUBLIC_AI_MODEL=gemini-1.5-flash
NEXT_PUBLIC_AI_MAX_TOKENS=2048
NEXT_PUBLIC_AI_TEMPERATURE=0.7
```

## 📊 Model Comparison

| Model | Speed | Quality | Use Case |
|-------|--------|---------|----------|
| `gemini-1.5-flash` | ⚡ Fastest | ⭐⭐⭐ Good | Quick analysis |
| `gemini-1.5-pro` | 🐌 Slower | ⭐⭐⭐⭐⭐ Best | Detailed analysis |
| `gemini-pro` | 🐌 Legacy | ⭐⭐⭐ OK | May be deprecated |

## 🚀 Quick Fix Steps

1. **Update your model**:
   ```bash
   NEXT_PUBLIC_AI_MODEL=gemini-1.5-flash
   ```

2. **Restart your dev server**:
   ```bash
   npm run dev
   ```

3. **Clear browser cache** and refresh

4. **Check browser console** for detailed error messages

5. **Test with a simple question** like "Hello" first

## 🔍 Debugging Tips

### Enable detailed logging:
Add this to your AI service for debugging:
```javascript
console.log('API URL:', apiUrl);
console.log('Request body:', JSON.stringify(requestBody, null, 2));
console.log('Response:', await response.json());
```

### Common error codes:
- `400`: Bad request (check your payload format)
- `403`: API key invalid or no permissions
- `404`: Model not found (wrong model name)
- `429`: Rate limited (too many requests)
- `500`: Server error (try again later)

## ✅ Success Indicators

When working correctly, you should see:
- ✅ Green status indicator in AI Assistant
- 🤖 Detailed responses from Gemini
- No error messages in browser console
- Fast response times (1-3 seconds)

## 🆘 Still Having Issues?

1. **Check the browser console** for detailed error messages
2. **Verify your internet connection**
3. **Try a different model** (gemini-1.5-pro vs gemini-1.5-flash)
4. **Regenerate your API key** if it's old
5. **Contact support** with the exact error message

Remember: The fallback responses will always work even if the API fails, so your app remains functional!
