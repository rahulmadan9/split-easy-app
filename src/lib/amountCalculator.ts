/**
 * Parses and calculates simple arithmetic expressions with addition and subtraction.
 * Supports expressions like "50+30-10" which would return "70".
 *
 * @param input - The input string containing the arithmetic expression
 * @returns The calculated result as a string, or the original input if invalid
 */
export function calculateAmount(input: string): string {
  // Trim whitespace
  const trimmed = input.trim();

  // If empty or already a simple number, return as is
  if (!trimmed || !trimmed.match(/[+\-]/)) {
    return trimmed;
  }

  try {
    // Validate: only allow numbers, +, -, spaces, and decimal points
    const validPattern = /^[\d\s+\-.]+$/;
    if (!validPattern.test(trimmed)) {
      return trimmed;
    }

    // Check for invalid patterns (e.g., multiple operators in a row, starting/ending with operators)
    if (/[+\-]{2,}/.test(trimmed) || /^[+\-]/.test(trimmed) || /[+\-]$/.test(trimmed)) {
      return trimmed;
    }

    // Split by + and -, keeping the operators
    const tokens: string[] = [];
    let currentNumber = '';

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (char === '+' || char === '-') {
        if (currentNumber) {
          tokens.push(currentNumber.trim());
          currentNumber = '';
        }
        tokens.push(char);
      } else {
        currentNumber += char;
      }
    }

    if (currentNumber) {
      tokens.push(currentNumber.trim());
    }

    // Calculate the result
    let result = parseFloat(tokens[0]);

    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = parseFloat(tokens[i + 1]);

      if (isNaN(operand)) {
        return trimmed;
      }

      if (operator === '+') {
        result += operand;
      } else if (operator === '-') {
        result -= operand;
      }
    }

    // Return result with up to 2 decimal places, removing trailing zeros
    if (isNaN(result)) {
      return trimmed;
    }

    return result.toFixed(2).replace(/\.?0+$/, '');
  } catch (error) {
    // If anything goes wrong, return the original input
    return trimmed;
  }
}
