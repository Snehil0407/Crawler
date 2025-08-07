import { getAIConfig, isAIConfigured, SECURITY_ANALYSIS_PROMPTS } from './aiConfig';
import { ScanResult, Vulnerability } from '../types';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

class AIService {
  private config = getAIConfig();

  async analyzeScan(scanData: ScanResult, userQuestion: string): Promise<AIResponse> {
    if (!isAIConfigured()) {
      return {
        success: false,
        message: "AI assistant is not configured. Please add your Gemini API key to enable this feature.",
        error: "Missing API key"
      };
    }

    try {
      // Prepare scan summary for AI context
      const scanSummary = this.prepareScanContext(scanData);
      
      // TODO: Replace with actual Gemini API call
      // This is a placeholder implementation
      return await this.callGeminiAPI(scanSummary, userQuestion);
      
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        message: "I apologize, but I encountered an error analyzing your scan. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  private prepareScanContext(scanData: ScanResult): string {
    const vulnerabilities = scanData.vulnerabilities || [];
    const summary = scanData.summary?.scan_info;
    
    let context = `Security Scan Analysis Context:\n\n`;
    
    if (summary) {
      context += `Target URL: ${summary.target_url}\n`;
      context += `Total Vulnerabilities: ${summary.total_vulnerabilities || vulnerabilities.length}\n`;
      context += `Scan Duration: ${Math.round(summary.duration || 0)} seconds\n\n`;
    }
    
    if (vulnerabilities.length > 0) {
      context += `Vulnerabilities Found:\n`;
      
      // Group vulnerabilities by type
      const vulnByType = vulnerabilities.reduce((acc, vuln) => {
        const type = vuln.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(vuln);
        return acc;
      }, {} as Record<string, Vulnerability[]>);
      
      Object.entries(vulnByType).forEach(([type, vulns]) => {
        context += `\n${type} (${vulns.length} instances):\n`;
        vulns.slice(0, 3).forEach((vuln, index) => {
          context += `  ${index + 1}. URL: ${vuln.url}\n`;
          if (vuln.details?.description) {
            context += `     Description: ${vuln.details.description}\n`;
          }
          if (vuln.details?.severity) {
            context += `     Severity: ${vuln.details.severity}\n`;
          }
        });
        if (vulns.length > 3) {
          context += `  ... and ${vulns.length - 3} more instances\n`;
        }
      });
    } else {
      context += `No vulnerabilities found in this scan.\n`;
    }
    
    return context;
  }

  private async callGeminiAPI(scanContext: string, userQuestion: string): Promise<AIResponse> {
    try {
      // Use the latest Gemini API v1 endpoint with the correct model name
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${SECURITY_ANALYSIS_PROMPTS.vulnerability_analysis}

Scan Context:
${scanContext}

User Question: ${userQuestion}

Please provide a detailed, technical analysis focusing on security implications, remediation steps, and best practices. Use code examples where helpful.`
            }]
          }],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Response Error:', errorData);
        throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Gemini API Response:', data);
      
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        console.error('No response text found in:', data);
        throw new Error('No response generated from Gemini API');
      }

      return {
        success: true,
        message: aiResponse
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Check if it's a model not found error and suggest alternatives
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let troubleshootingInfo = '';
      
      if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
        troubleshootingInfo = `

**🔧 Troubleshooting Steps:**
1. **Try alternative models**: gemini-1.5-flash, gemini-1.5-pro, or gemini-pro
2. **Check model availability** in your region
3. **Verify API key permissions** for the selected model
4. **Update to latest API version** if using older endpoints

**🔄 Quick Fix**: Try changing your model in .env.local to:
\`NEXT_PUBLIC_AI_MODEL=gemini-1.5-pro\``;
      }
      
      // Fallback to placeholder response if API fails
      const fallbackResponse = this.generatePlaceholderResponse(scanContext, userQuestion);
      
      return {
        success: true,
        message: `⚠️ **API Connection Issue**

**Error Details:** ${errorMessage}

${troubleshootingInfo}

**Fallback Analysis:**

${fallbackResponse}

**Status Check:**
• API Key: ${this.config.apiKey ? '✅ Present' : '❌ Missing'}
• Model: ${this.config.model}
• Endpoint: Working with fallback responses`
      };
    }
  }

  private generatePlaceholderResponse(scanContext: string, userQuestion: string): string {
    const lowerQuestion = userQuestion.toLowerCase();
    
    if (lowerQuestion.includes('critical') || lowerQuestion.includes('high severity')) {
      return `Based on your scan results, I can help identify critical vulnerabilities:

🚨 **Critical Security Issues Analysis**

The scan found several vulnerabilities that require immediate attention. Here's my analysis:

**High Priority Issues:**
• SQL Injection vulnerabilities - These allow attackers to manipulate database queries
• Cross-Site Scripting (XSS) - Can lead to session hijacking and data theft
• Authentication bypass issues - May allow unauthorized access

**Immediate Actions:**
1. **Input Validation**: Implement proper input sanitization and parameterized queries
2. **Output Encoding**: Encode all user input before displaying it
3. **Security Headers**: Add CSP, X-Frame-Options, and other security headers

**Code Example:**
\`\`\`javascript
// Instead of: query = "SELECT * FROM users WHERE id = " + userId
// Use parameterized queries:
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);
\`\`\`

*Note: This is a demonstration response. Configure your Gemini API key for detailed, real-time analysis of your specific vulnerabilities.*`;
    }
    
    if (lowerQuestion.includes('xss') || lowerQuestion.includes('cross-site scripting')) {
      return `🛡️ **Cross-Site Scripting (XSS) Analysis**

Based on your scan, I've identified XSS vulnerabilities that need attention:

**What XSS Means:**
XSS allows attackers to inject malicious scripts into web pages viewed by other users.

**Types Found:**
• **Reflected XSS**: User input directly reflected in response
• **Stored XSS**: Malicious scripts stored in database
• **DOM-based XSS**: Client-side code vulnerability

**Prevention Strategies:**
1. **Input Validation**: Validate all user inputs server-side
2. **Output Encoding**: Encode data before inserting into HTML
3. **Content Security Policy**: Implement strict CSP headers

**Example Fix:**
\`\`\`html
<!-- Vulnerable -->
<div>Welcome {userName}</div>

<!-- Secure -->
<div>Welcome {escapeHtml(userName)}</div>
\`\`\`

*Configure your Gemini API key for personalized analysis of your specific XSS vulnerabilities.*`;
    }
    
    if (lowerQuestion.includes('sql injection') || lowerQuestion.includes('sqli')) {
      return `💉 **SQL Injection Vulnerability Analysis**

Your scan has detected SQL injection vulnerabilities - here's what you need to know:

**Risk Level**: **HIGH** - Can lead to complete database compromise

**Common Patterns Found:**
• User input directly concatenated into SQL queries
• Insufficient input validation
• Missing parameterized queries

**Remediation Steps:**
1. **Use Parameterized Queries**: Never concatenate user input
2. **Input Validation**: Validate data type, length, format
3. **Principle of Least Privilege**: Use database accounts with minimal permissions

**Secure Code Example:**
\`\`\`python
# Vulnerable
query = f"SELECT * FROM users WHERE email = '{email}'"

# Secure
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (email,))
\`\`\`

*For detailed analysis of your specific SQL injection points, please configure your Gemini API key.*`;
    }
    
    if (lowerQuestion.includes('recommendation') || lowerQuestion.includes('fix') || lowerQuestion.includes('remediation')) {
      return `🔧 **Security Remediation Recommendations**

Based on your scan results, here are prioritized security improvements:

**Immediate Actions (Critical):**
1. **Input Validation**: Implement comprehensive input validation
2. **Authentication**: Strengthen authentication mechanisms
3. **Error Handling**: Implement secure error handling

**Short-term Improvements (High):**
1. **Security Headers**: Implement HSTS, CSP, X-Frame-Options
2. **Session Management**: Secure session configuration
3. **Access Controls**: Review and tighten access controls

**Long-term Security (Medium):**
1. **Security Monitoring**: Implement logging and monitoring
2. **Regular Scans**: Schedule automated security scans
3. **Security Training**: Team security awareness training

**Implementation Timeline:**
• Week 1: Fix critical vulnerabilities
• Week 2-3: Implement security headers and controls
• Month 1: Complete security monitoring setup

*Configure your Gemini API key for detailed, context-aware recommendations specific to your application.*`;
    }
    
    // Default response
    return `🤖 **AI Security Analysis**

Thank you for your question about the security scan results. I'm ready to help analyze your vulnerabilities and provide security recommendations.

**What I Can Help With:**
• Vulnerability impact assessment
• Remediation strategies and code examples
• Security best practices implementation
• Risk prioritization and timelines

**Sample Questions You Can Ask:**
• "What are the most critical vulnerabilities?"
• "How do I fix the SQL injection issues?"
• "Explain the XSS vulnerabilities found"
• "What security headers should I implement?"

**To Get Started:**
Currently running in demo mode. To unlock full AI-powered security analysis:

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your environment variables as \`NEXT_PUBLIC_GEMINI_API_KEY\`
3. Restart your application

Once configured, I'll provide detailed, contextual analysis of your specific security issues with actionable remediation steps.

*This response is generated locally. Configure your API key for real-time AI analysis.*`;
  }
}

export const aiService = new AIService();
export default aiService;
