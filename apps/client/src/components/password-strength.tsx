import { cn } from "@/lib/utils";
import type { PasswordCriteria, PasswordStrength } from "@paulgeorge35/hooks";

interface PasswordStrengthProps {
  strength: PasswordStrength;
  criteria: PasswordCriteria;
  score: number;
}

export function PasswordStrength({ criteria, score }: PasswordStrengthProps) {
  return (
    <div className="vertical gap-2 w-full">
      <div className="horizontal gap-2 items-center">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", {
              "bg-red-500": score < 40,
              "bg-yellow-500": score >= 40 && score < 70,
              "bg-green-500": score >= 70,
            })}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-zinc-400">
        <li className={cn("flex items-center gap-1", {
          "text-green-500": criteria.minLength
        })}>
          {criteria.minLength ? "✓" : "·"} Min 8 characters
        </li>
        <li className={cn("flex items-center gap-1", {
          "text-green-500": criteria.hasUpperCase && criteria.hasLowerCase
        })}>
          {criteria.hasUpperCase && criteria.hasLowerCase ? "✓" : "·"} Mixed case
        </li>
        <li className={cn("flex items-center gap-1", {
          "text-green-500": criteria.hasNumber
        })}>
          {criteria.hasNumber ? "✓" : "·"} Number
        </li>
        <li className={cn("flex items-center gap-1", {
          "text-green-500": criteria.hasSpecialChar
        })}>
          {criteria.hasSpecialChar ? "✓" : "·"} Special character
        </li>
      </ul>
    </div>
  );
}
