// Gemini API Model Tester
// This utility helps test different Gemini models and API endpoints

export async function testGeminiModels(apiKey: string) {
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  const results = [];

  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, this is a test message. Please respond with 'Test successful'."
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        results.push({
          model,
          status: 'SUCCESS',
          response: text || 'No text in response',
          data
        });
        console.log(`✅ ${model}: SUCCESS`);
      } else {
        const errorData = await response.json();
        results.push({
          model,
          status: 'ERROR',
          error: errorData,
          statusCode: response.status
        });
        console.log(`❌ ${model}: ERROR ${response.status}`);
      }
    } catch (error) {
      results.push({
        model,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`💥 ${model}: FAILED - ${error}`);
    }
  }

  return results;
}

// Test function for listing available models
export async function listAvailableModels(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Available models:', data);
      return data;
    } else {
      const errorData = await response.json();
      console.error('Error listing models:', errorData);
      return null;
    }
  } catch (error) {
    console.error('Failed to list models:', error);
    return null;
  }
}

// Usage in browser console:
// import { testGeminiModels, listAvailableModels } from './lib/geminiTester';
// testGeminiModels('your-api-key');
// listAvailableModels('your-api-key');
