import type { WishlistItem } from './types.ts';

/**
 * Initial wishlist, used only the first time the app runs on a device
 * (when no saved data exists yet). Items with a currency that was not
 * stated by the owner default to RON and can be edited in-app.
 */
export function seedItems(): WishlistItem[] {
  const base = Date.now();
  const raw: Array<Omit<WishlistItem, 'id' | 'createdAt' | 'acquired'>> = [
    { name: 'Darkthrone — box set', price: 650, currency: 'RON', estimate: false },
    { name: 'The Ruins of Beverast — box set', price: 400, currency: 'RON', estimate: false },
    { name: 'Asrar order — Devil Doll & Sarcophagus', price: 620, currency: 'EUR', estimate: false },
    { name: 'Behemoth — upcoming album', price: 600, currency: 'RON', estimate: true },
    { name: 'Dissection — box set', price: 900, currency: 'RON', estimate: false },
  ];

  return raw.map((item, i) => ({
    ...item,
    id: `seed-${i + 1}`,
    acquired: false,
    createdAt: base + i,
  }));
}
