export const CURRENCIES = ['RON', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface WishlistItem {
  id: string;
  name: string;
  /** Price in major units of `currency` (e.g. 650 means 650 RON). */
  price: number;
  currency: Currency;
  /** True when the price is a rough guess rather than a known figure. */
  estimate: boolean;
  /** True once the item has been bought. */
  acquired: boolean;
  createdAt: number;
}

/** The shape used when creating or editing an item (no generated fields). */
export type WishlistDraft = Pick<
  WishlistItem,
  'name' | 'price' | 'currency' | 'estimate'
>;
