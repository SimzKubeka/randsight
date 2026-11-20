// Row labels as the review reads them. Transfers are not a reporting category.
const LABELS = {
  income: 'Salary received',
  medical: 'Medical spending',
  groceries: 'Grocery spending',
  housing: 'Housing',
  utilities: 'Utilities',
  transport: 'Transport',
  'eating-out': 'Eating out',
} as const

export type Category = keyof typeof LABELS

export const isCategory = (value: unknown): value is Category => typeof value === 'string' && Object.hasOwn(LABELS, value)

export const rowLabel = (key: string): string => (isCategory(key) ? LABELS[key] : key)
