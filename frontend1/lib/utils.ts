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
