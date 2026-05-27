import type { WishlistItem } from './types.ts';

/**
 * Initial wishlist, used only the first time the app runs on a device
 * (when no saved data exists yet). All prices are in RON; `link` points to
 * where the item can be found/bought online. Everything is editable in-app.
 */
export function seedItems(): WishlistItem[] {
  const base = Date.now();
  const raw: Array<Omit<WishlistItem, 'id' | 'createdAt' | 'acquired'>> = [
    {
      name: 'Darkthrone — Pre-historic Metal (box set)',
      price: 625,
      currency: 'RON',
      link: 'https://www.headbangershop.ro/produs/darkthrone-pre-historic-metal-cdmcsplatter-box-set-box/',
      estimate: false,
    },
    {
      name: 'The Ruins of Beverast — box set',
      price: 400,
      currency: 'RON',
      link: 'https://www.headbangershop.ro/artist/the-ruins-of-beverast/',
      estimate: false,
    },
    {
      name: 'Asrar order — Devil Doll & Sarcophagus',
      price: 620,
      currency: 'RON',
      link: 'https://www.asrarlabel.com/shop/',
      estimate: false,
    },
    {
      name: 'Behemoth — The Shit Ov God (box set)',
      price: 600,
      currency: 'RON',
      link: 'https://behemoth-store.com/collections/the-shit-ov-god',
      estimate: true,
    },
    {
      name: 'Dissection — Storm of the Light’s Bane (box set)',
      price: 900,
      currency: 'RON',
      link: 'https://darknessshallrise.de/product/dissection-swe-i-am-the-great-shadow-19-tape-box-pre-order/',
      estimate: false,
    },
  ];

  return raw.map((item, i) => ({
    ...item,
    id: `seed-${i + 1}`,
    acquired: false,
    createdAt: base + i,
  }));
}
