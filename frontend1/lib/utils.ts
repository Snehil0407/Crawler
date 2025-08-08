import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Vulnerability } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function getSeverity(vulnerability: Vulnerability): 'critical' | 'high' | 'medium' | 'low' {
  const severity = vulnerability.details?.severity?.toLowerCase() || 'medium';
  return ['critical', 'high', 'medium', 'low'].includes(severity) 
    ? severity as 'critical' | 'high' | 'medium' | 'low'
    : 'medium';
}

export function formatVulnerabilityTitle(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function getOwaspCategory(vulnType: string): string {
  const owaspMapping: Record<string, string> = {
    'broken_access_control': 'A01: Broken Access Control',
    'crypto_failures': 'A02: Cryptographic Failures',
    'injection': 'A03: Injection',
    'insecure_design': 'A04: Insecure Design',
    'security_misconfiguration': 'A05: Security Misconfiguration',
    'vulnerable_components': 'A06: Vulnerable Components',
    'auth_failures': 'A07: Auth Failures',
    'integrity_failures': 'A08: Integrity Failures',
    'logging_monitoring': 'A09: Logging & Monitoring',
    'ssrf': 'A10: Server Side Request Forgery',
    'xss': 'A03: Cross-Site Scripting',
    'sql_injection': 'A03: SQL Injection'
  };

  for (const [key, category] of Object.entries(owaspMapping)) {
    if (vulnType.includes(key)) {
      return category;
    }
  }
  return 'Other';
}

export function animateCounter(setValue: (value: number) => void, target: number, duration: number = 1000) {
  const start = 0;
  const increment = target / (duration / 50);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    setValue(Math.round(current));
  }, 50);
}

export function validateEmailDomain(email: string): { isValid: boolean; error?: string } {
  // Check if email has a proper domain (not generic Gmail patterns)
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  
  // Extract domain and local parts
  const [localPart, domain] = email.split('@');
  const localLower = localPart.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // Block generic/demo patterns in local part
  const blockedLocalPatterns = [
    /^demo\d*$/,
    /^test\d*$/,
    /^example\d*$/,
    /^sample\d*$/,
    /^\d+$/,
    /^[a-z]{1,3}\d+$/,
    /^temp\d*$/,
    /^fake\d*$/,
    /^user\d*$/,
    /^admin\d*$/
  ];
  
  // Check if local part matches blocked patterns
  for (const pattern of blockedLocalPatterns) {
    if (pattern.test(localLower)) {
      return { 
        isValid: false, 
        error: 'Access restricted. Please use a valid corporate or institutional email address. Generic email addresses are not allowed.' 
      };
    }
  }
  
  // Special handling for Gmail - allow but with restrictions
  if (domainLower === 'gmail.com') {
    // Block obvious generic Gmail patterns
    const genericGmailPatterns = [
      /^demo\d*$/,
      /^test\d*$/,
      /^user\d*$/,
      /^admin\d*$/,
      /^sample\d*$/,
      /^example\d*$/,
      /^temp\d*$/,
      /^fake\d*$/,
      /^\d+$/
    ];
    
    for (const pattern of genericGmailPatterns) {
      if (pattern.test(localLower)) {
        return { 
          isValid: false, 
          error: 'Access restricted. Please use a valid email address. Generic email addresses like demo123@gmail.com are not allowed.' 
        };
      }
    }
  }
  
  return { isValid: true };
}
