import type { WishlistItem } from './types.ts';

/**
 * Initial wishlist, used only the first time the app runs on a device
 * (when no saved data exists yet). All prices are in RON; `link` points to
 * where the item can be found/bought online and `releaseDate` (ISO yyyy-mm-dd)
 * marks an upcoming release where known. Everything is editable in-app.
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
      name: 'Asrar: Devil Doll + Sarcophagus',
      price: 620,
      currency: 'RON',
      link: 'https://www.asrarlabel.com/shop/',
      estimate: false,
    },
    {
      name: 'Behemoth — I, Scvlptor',
      price: 600,
      currency: 'RON',
      link: 'https://behemoth-store.com/',
      releaseDate: '2026-06-01',
      estimate: true,
    },
    {
      name: 'Dissection — Reinkaos',
      price: 900,
      currency: 'RON',
      // Not yet available — point at the label's main site until a product page exists.
      link: 'https://darknessshallrise.de/',
      releaseDate: '2026-06-08',
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
