// AI Configuration for WebSentinals
// This file contains configuration for AI assistance features

export interface AIConfig {
  provider: 'gemini' | 'openai' | 'claude';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Default configuration - update with your API keys
export const defaultAIConfig: Partial<AIConfig> = {
  provider: 'gemini',
  model: 'gemini-1.5-flash',
  maxTokens: 2048,
  temperature: 0.7
};

// Get AI configuration from environment variables or defaults
export const getAIConfig = (): AIConfig => {
  return {
    provider: (process.env.NEXT_PUBLIC_AI_PROVIDER as 'gemini' | 'openai' | 'claude') || 'gemini',
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    model: process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-1.5-flash',
    maxTokens: parseInt(process.env.NEXT_PUBLIC_AI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.NEXT_PUBLIC_AI_TEMPERATURE || '0.7')
  };
};

// Check if AI is properly configured
export const isAIConfigured = (): boolean => {
  const config = getAIConfig();
  return !!config.apiKey;
};

// System prompts for different types of security analysis
export const SECURITY_ANALYSIS_PROMPTS = {
  vulnerability_analysis: `You are a cybersecurity expert analyzing web application security scan results. 
Provide detailed, technical analysis of vulnerabilities while being accessible to developers. 
Focus on:
- Risk assessment and severity explanation
- Technical details of the vulnerability
- Potential attack scenarios
- Remediation steps and best practices
- Code examples where helpful`,

  general_security: `You are a cybersecurity consultant helping developers understand their security scan results.
Be helpful, informative, and provide actionable advice. Always prioritize security best practices.`,

  remediation_guidance: `You are a security engineer providing remediation guidance. 
Focus on practical, implementable solutions that developers can follow step-by-step.
Include code examples, configuration changes, and testing recommendations.`
};

export default {
  getAIConfig,
  isAIConfigured,
  SECURITY_ANALYSIS_PROMPTS,
  defaultAIConfig
};
