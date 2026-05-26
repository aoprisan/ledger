import { CURRENCIES, type Currency, type WishlistDraft, type WishlistItem } from './types.ts';
import { seedItems } from './seed.ts';

const STORAGE_KEY = 'ledger.wishlist.v1';

type Listener = (items: readonly WishlistItem[]) => void;

function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

function parseItem(value: unknown): WishlistItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return null;
  if (typeof v.price !== 'number' || !Number.isFinite(v.price)) return null;
  if (!isCurrency(v.currency)) return null;
  return {
    id: v.id,
    name: v.name,
    price: v.price,
    currency: v.currency,
    estimate: v.estimate === true,
    acquired: v.acquired === true,
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
  };
}

function load(): WishlistItem[] | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(parseItem).filter((x): x is WishlistItem => x !== null);
  } catch {
    return null;
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class WishlistStore {
  private items: WishlistItem[];
  private readonly listeners = new Set<Listener>();

  constructor() {
    const loaded = load();
    if (loaded === null) {
      this.items = seedItems();
      this.persist();
    } else {
      this.items = loaded;
    }
  }

  getAll(): readonly WishlistItem[] {
    return this.items;
  }

  add(draft: WishlistDraft): void {
    this.items = [
      ...this.items,
      { ...draft, id: newId(), acquired: false, createdAt: Date.now() },
    ];
    this.commit();
  }

  update(id: string, draft: WishlistDraft): void {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, ...draft } : item,
    );
    this.commit();
  }

  remove(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.commit();
  }

  toggleAcquired(id: string): void {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, acquired: !item.acquired } : item,
    );
    this.commit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.items);
    return () => this.listeners.delete(listener);
  }

  private commit(): void {
    this.persist();
    for (const listener of this.listeners) listener(this.items);
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Storage may be unavailable (private mode / quota); keep running in-memory.
    }
  }
}
