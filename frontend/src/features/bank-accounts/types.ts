import type { FinanceAccountDto } from '@/types/api.types';
import { AccountType } from '@/types/api.types';

export type BankAccount = FinanceAccountDto;

export type CreateBankAccountDto = {
  name: string;
  accountType: AccountType;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  isPrimary?: boolean;
  initialBalance?: number;
};

export type UpdateBankAccountDto = {
  name: string;
  accountType: AccountType;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  isPrimary?: boolean;
};

export const accountTypeLabels: Record<AccountType, string> = {
  [AccountType.Cash]: 'نقدي',
  [AccountType.Bank]: 'بنكي',
  [AccountType.Digital]: 'إلكتروني',
};

export const accountTypeVariants: Record<AccountType, 'success' | 'info' | 'primary'> = {
  [AccountType.Cash]: 'success',
  [AccountType.Bank]: 'info',
  [AccountType.Digital]: 'primary',
};

// Basic IBAN validation: starts with 2 letters, then alphanumeric, total 22-34 chars
export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}[0-9A-Z]{20,32}$/.test(cleaned);
}
