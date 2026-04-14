// Accounting report types — match backend response shapes exactly.

export enum AccountCategory {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5,
}

export type TrialBalanceRow = {
  accountCode: string;
  accountName: string;
  category: AccountCategory;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
};

export type TrialBalanceDto = {
  fromDate: string;
  toDate: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
};

export type IncomeStatementLine = {
  accountCode: string;
  accountName: string;
  amount: number;
};

export type IncomeStatementDto = {
  fromDate: string;
  toDate: string;
  revenues: IncomeStatementLine[];
  totalRevenue: number;
  expenses: IncomeStatementLine[];
  totalExpenses: number;
  netIncome: number;
};

export type BalanceSheetLine = {
  accountCode: string;
  accountName: string;
  balance: number;
};

export type BalanceSheetDto = {
  asOfDate: string;
  assets: BalanceSheetLine[];
  totalAssets: number;
  liabilities: BalanceSheetLine[];
  totalLiabilities: number;
  equity: BalanceSheetLine[];
  totalEquity: number;
  retainedEarnings: number;
  isBalanced: boolean;
};

export type ContactStatementEntry = {
  date: string;
  entryNumber: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
};

export type ContactStatementDto = {
  contactId: number;
  contactName: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  entries: ContactStatementEntry[];
  closingBalance: number;
};
