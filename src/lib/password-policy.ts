export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export function signUpPasswordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Your password must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  return null;
}
