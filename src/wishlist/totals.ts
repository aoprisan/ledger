import type { Currency, WishlistItem } from './types.ts';

export interface CurrencyTotal {
  currency: Currency;
  remaining: number;
  acquired: number;
  total: number;
}

/** Sum item prices per currency, split into still-wanted vs already-bought. */
export function totalsByCurrency(items: readonly WishlistItem[]): CurrencyTotal[] {
  const map = new Map<Currency, CurrencyTotal>();
  for (const item of items) {
    const entry =
      map.get(item.currency) ??
      { currency: item.currency, remaining: 0, acquired: 0, total: 0 };
    entry.total += item.price;
    if (item.acquired) entry.acquired += item.price;
    else entry.remaining += item.price;
    map.set(item.currency, entry);
  }
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
