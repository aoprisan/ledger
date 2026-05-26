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
      name: 'Darkthrone — The Fist in the Face of God (box set)',
      price: 650,
      currency: 'RON',
      link: 'https://burningshed.com/store/peaceville/darkthrone_the-fist-in-the-face-of-god_vinyl-boxset',
      estimate: false,
    },
    {
      name: 'The Ruins of Beverast — box set',
      price: 400,
      currency: 'RON',
      link: 'https://van-records.com/The-Ruins-Of-Beverast_1',
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
      link: 'https://behemoth.bandcamp.com/album/the-shit-ov-god',
      estimate: true,
    },
    {
      name: 'Dissection — Storm of the Light’s Bane (box set)',
      price: 900,
      currency: 'RON',
      link: 'https://tpl.se/music/dissection-storm-of-the-lights-bane-3/',
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
