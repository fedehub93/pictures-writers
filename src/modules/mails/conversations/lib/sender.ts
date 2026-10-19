export interface SenderAccount {
  name: string;
  displayName: string | null;
  email: string;
}

/** Compose the provider `from` value from the account's display name. */
export function resolveFrom(account: SenderAccount): string {
  const displayName = account.displayName?.trim() || account.name.trim();
  return displayName ? `${displayName} <${account.email}>` : account.email;
}
