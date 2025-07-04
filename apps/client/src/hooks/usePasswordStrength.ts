import { useMemo } from "react";

/**
 * Password strength criteria type
 */
export type PasswordCriteria = {
  /** Minimum length requirement */
  minLength: boolean;
  /** Contains at least one uppercase letter */
  hasUpperCase: boolean;
  /** Contains at least one lowercase letter */
  hasLowerCase: boolean;
  /** Contains at least one number */
  hasNumber: boolean;
  /** Contains at least one special character */
  hasSpecialChar: boolean;
};

/**
 * Password strength levels
 */
export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

/**
 * Return type for the usePasswordStrength hook
 */
export type UsePasswordStrength = {
  /** The calculated strength of the password */
  strength: PasswordStrength;
  /** Individual criteria checks for the password */
  criteria: PasswordCriteria;
  /** Score from 0-100 representing password strength */
  score: number;
};

/**
 * Configuration options for password strength checking
 */
export type PasswordStrengthOptions = {
  /** Minimum required length for the password (default: 8) */
  minLength?: number;
  /** Whether to require special characters (default: true) */
  requireSpecialChar?: boolean;
  /** Whether to require numbers (default: true) */
  requireNumber?: boolean;
  /** Whether to require mixed case (default: true) */
  requireMixedCase?: boolean;
};

/**
 * A React hook that evaluates password strength based on various criteria
 *
 * @param {string} password The password to evaluate
 * @param {PasswordStrengthOptions} options Configuration options for password requirements
 * @returns {UsePasswordStrength} Object containing password strength evaluation
 *
 * @example
 * ```typescript
 * const PasswordInput = () => {
 *   const [password, setPassword] = useState('');
 *   const { strength, criteria, score } = usePasswordStrength(password, {
 *     minLength: 10,
 *     requireSpecialChar: true
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         type="password"
 *         value={password}
 *         onChange={(e) => setPassword(e.target.value)}
 *       />
 *       <div>Strength: {strength} ({score}%)</div>
 *       <ul>
 *         <li>Min Length: {criteria.minLength ? '✅' : '❌'}</li>
 *         <li>Uppercase: {criteria.hasUpperCase ? '✅' : '❌'}</li>
 *         <li>Lowercase: {criteria.hasLowerCase ? '✅' : '❌'}</li>
 *         <li>Number: {criteria.hasNumber ? '✅' : '❌'}</li>
 *         <li>Special Char: {criteria.hasSpecialChar ? '✅' : '❌'}</li>
 *       </ul>
 *     </div>
 *   );
 * };
 * ```
 */
export const usePasswordStrength = (
  password: string,
  options: PasswordStrengthOptions = {}
): UsePasswordStrength => {
  const {
    minLength = 8,
    requireSpecialChar = true,
    requireNumber = true,
    requireMixedCase = true,
  } = options;

  return useMemo(() => {
    // Check individual criteria
    const criteria: PasswordCriteria = {
      minLength: password.length >= minLength,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    // Calculate base score
    let score = 0;
    let requiredCriteria = 1; // minLength is always required

    // Add points for length
    score += Math.min((password.length / minLength) * 20, 20);

    // Add points for uppercase if required
    if (requireMixedCase) {
      requiredCriteria++;
      if (criteria.hasUpperCase) score += 20;
    }

    // Add points for lowercase if required
    if (requireMixedCase) {
      requiredCriteria++;
      if (criteria.hasLowerCase) score += 20;
    }

    // Add points for numbers if required
    if (requireNumber) {
      requiredCriteria++;
      if (criteria.hasNumber) score += 20;
    }

    // Add points for special characters if required
    if (requireSpecialChar) {
      requiredCriteria++;
      if (criteria.hasSpecialChar) score += 20;
    }

    // Normalize score based on required criteria
    score = Math.min(Math.round((score / (requiredCriteria * 20)) * 100), 100);

    // Determine strength based on score and required criteria
    let strength: PasswordStrength = "weak";
    if (score >= 100) {
      strength = "very-strong";
    } else if (score >= 80) {
      strength = "strong";
    } else if (score >= 50) {
      strength = "medium";
    }

    return {
      strength,
      criteria,
      score,
    };
  }, [
    password,
    minLength,
    requireSpecialChar,
    requireNumber,
    requireMixedCase,
  ]);
};
