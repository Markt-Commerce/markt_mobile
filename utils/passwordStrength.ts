/**
 * Password strength
 * Client-side rules: min 8 chars, 1 digit, 1 lowercase, 1 uppercase
 */

export interface PasswordStrengthResult {
  level: number; // 0-4
  checks: {
    length: boolean;
    digit: boolean;
    lowercase: boolean;
    uppercase: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
  const met = Object.values(checks).filter(Boolean).length;
  return { level: met, checks };
}
