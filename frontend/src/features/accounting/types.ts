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

// ==================== Chart of Accounts ====================
export type ChartOfAccountNode = {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  category: AccountCategory;
  nature: 1 | 2; // 1 = Debit, 2 = Credit
  parentId: number | null;
  level: number;
  isGroup: boolean;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  children?: ChartOfAccountNode[];
};

export function buildTree(flat: ChartOfAccountNode[]): ChartOfAccountNode[] {
  const byId = new Map<number, ChartOfAccountNode>();
  const roots: ChartOfAccountNode[] = [];

  for (const raw of flat) {
    byId.set(raw.id, { ...raw, children: [] });
  }

  for (const node of byId.values()) {
    if (node.parentId != null && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: ChartOfAccountNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    for (const n of nodes) if (n.children?.length) sortNodes(n.children);
  };
  sortNodes(roots);

  return roots;
}
