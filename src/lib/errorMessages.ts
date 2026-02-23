/**
 * Maps database/auth errors to user-friendly messages
 * to prevent leaking internal implementation details.
 */
export function getUserFriendlyError(error: any): string {
  const code = error?.code;
  const message = error?.message?.toLowerCase() ?? '';

  // Auth errors
  if (message.includes('invalid login credentials')) return 'Invalid email or password.';
  if (message.includes('email not confirmed')) return 'Please verify your email before signing in.';
  if (message.includes('user already registered')) return 'An account with this email already exists.';
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) return 'Too many attempts. Please try again later.';

  // Database constraint errors
  if (code === '23505') return 'This item already exists.';
  if (code === '23503') return 'Referenced item not found.';
  if (code === '23514' || message.includes('violates check constraint')) return 'Invalid data provided.';

  // RLS / permission errors
  if (code === '42501' || code === 'PGRST116' || message.includes('permission denied') || message.includes('row-level security')) {
    return 'Access denied.';
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Validates that a stock symbol matches the expected Indian stock format.
 */
export function isValidStockSymbol(symbol: string): boolean {
  return /^[A-Z]+\.NS$/.test(symbol) && symbol.length <= 20;
}
