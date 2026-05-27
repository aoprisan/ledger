import { clear, h } from '../dom.ts';
import type { WishlistItem } from './types.ts';
import type { WishlistStore } from './store.ts';
import { formatMoney, totalsByCurrency } from './totals.ts';

/** Render an ISO `yyyy-mm-dd` date for display, flagging whether it's still ahead. */
function formatReleaseDate(iso: string): { label: string; upcoming: boolean } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  // Build from parts (not `new Date(iso)`) so the day never shifts across time zones.
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const label = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return { label, upcoming: date.getTime() >= today.getTime() };
}

interface RowOptions {
  /** When provided, the row gets an "Amend" button wired to this. */
  onEdit?: (item: WishlistItem) => void;
  /** Runs after the user confirms a "Banish"; defaults to a plain store remove. */
  onRemove?: (item: WishlistItem) => void;
}

/** One `<li>` for a relic — shared by the Wishlist and the Reliquary. */
function buildItemRow(item: WishlistItem, store: WishlistStore, opts: RowOptions = {}): HTMLLIElement {
  const checkbox = h('input', {
    type: 'checkbox',
    checked: item.acquired,
    ariaLabel: item.acquired
      ? `Return "${item.name}" to the wishlist`
      : `Mark "${item.name}" as claimed`,
    title: item.acquired ? 'Return to the wishlist' : 'Mark as claimed',
    on: { change: () => store.toggleAcquired(item.id) },
  });

  const badges = h('span', { class: 'badges' });
  if (!item.releaseDate) {
    badges.append(h('span', { class: 'badge badge-out', text: 'out', title: 'Already released' }));
  }
  if (item.estimate) badges.append(h('span', { class: 'badge badge-estimate', text: 'estimate' }));

  const nameEl = item.link
    ? h('a', {
        class: 'wl-name wl-link',
        text: item.name,
        href: item.link,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: 'Open product page',
      })
    : h('span', { class: 'wl-name', text: item.name });

  const mainChildren: Node[] = [nameEl, badges];
  const dateInfo = item.releaseDate ? formatReleaseDate(item.releaseDate) : null;
  if (dateInfo) {
    mainChildren.push(
      h('span', {
        class: dateInfo.upcoming ? 'wl-date is-upcoming' : 'wl-date',
        text: dateInfo.label,
        title: dateInfo.upcoming ? 'Not yet released' : 'Released',
      }),
    );
  }

  const actions = h('div', { class: 'wl-actions' });
  if (opts.onEdit) {
    const onEdit = opts.onEdit;
    actions.append(
      h('button', {
        type: 'button',
        class: 'btn btn-icon',
        text: 'Amend',
        ariaLabel: `Edit ${item.name}`,
        on: { click: () => onEdit(item) },
      }),
    );
  }
  const remove = opts.onRemove ?? ((it: WishlistItem) => store.remove(it.id));
  actions.append(
    h('button', {
      type: 'button',
      class: 'btn btn-icon btn-danger',
      text: 'Banish',
      ariaLabel: `Delete ${item.name}`,
      on: {
        click: () => {
          if (confirm(`Banish "${item.name}" from the ledger?`)) remove(item);
        },
      },
    }),
  );

  return h('li', { class: 'wl-item' }, [
    h('label', { class: 'wl-check' }, [checkbox]),
    h('div', { class: 'wl-main' }, mainChildren),
    h('span', { class: 'wl-price', text: formatMoney(item.price, item.currency) }),
    actions,
  ]);
}

type SummaryMode = 'wishlist' | 'reliquary';

/** Per-currency totals card: "Yet to claim" for the wishlist, "Claimed" for the reliquary. */
function renderSummary(container: HTMLElement, items: readonly WishlistItem[], mode: SummaryMode): void {
  clear(container);
  const label = mode === 'wishlist' ? 'Yet to claim' : 'Claimed';
  for (const t of totalsByCurrency(items)) {
    const figure = mode === 'wishlist' ? t.remaining : t.acquired;
    if (figure <= 0) continue;
    container.append(
      h('div', { class: 'summary-card' }, [
        h('span', { class: 'summary-currency', text: t.currency }),
        h('span', { class: 'summary-label', text: label }),
        h('span', { class: 'summary-remaining', text: formatMoney(figure, t.currency), title: label }),
        h('span', { class: 'summary-total', text: `of ${formatMoney(t.total, t.currency)} conjured` }),
      ]),
    );
  }
}

export function mountWishlist(root: HTMLElement, store: WishlistStore): void {
  let editingId: string | null = null;

  // --- Form (built once, reused for both "add" and "edit") -----------------
  const nameInput = h('input', {
    type: 'text',
    id: 'wl-name',
    name: 'name',
    placeholder: 'e.g. Mayhem — De Mysteriis Dom Sathanas (box)',
    required: true,
    class: 'field-input',
  });

  const priceInput = h('input', {
    type: 'number',
    id: 'wl-price',
    name: 'price',
    placeholder: '0',
    min: '0',
    step: '0.01',
    required: true,
    class: 'field-input',
  });

  const linkInput = h('input', {
    type: 'url',
    id: 'wl-link',
    name: 'link',
    placeholder: 'https://… (optional)',
    class: 'field-input',
  });

  const dateInput = h('input', {
    type: 'date',
    id: 'wl-date',
    name: 'releaseDate',
    class: 'field-input',
  });

  const estimateInput = h('input', { type: 'checkbox', id: 'wl-estimate', name: 'estimate' });

  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary', text: 'Inscribe' });
  const cancelBtn = h('button', {
    type: 'button',
    class: 'btn btn-ghost',
    text: 'Abandon',
    on: { click: () => resetForm() },
  });
  cancelBtn.hidden = true;

  const form = h('form', { class: 'wl-form', ariaLabel: 'Add or edit a wishlist item' }, [
    h('p', { class: 'form-title', text: 'Inscribe a want' }),
    h('div', { class: 'field field-grow' }, [
      h('label', { for: 'wl-name', text: 'Relic', class: 'field-label' }),
      nameInput,
    ]),
    h('div', { class: 'field' }, [
      h('label', { for: 'wl-price', text: 'Price · RON', class: 'field-label' }),
      priceInput,
    ]),
    h('div', { class: 'field field-link' }, [
      h('label', { for: 'wl-link', text: 'Link', class: 'field-label' }),
      linkInput,
    ]),
    h('div', { class: 'field field-date' }, [
      h('label', { for: 'wl-date', text: 'Rises', class: 'field-label' }),
      dateInput,
    ]),
    h('label', { class: 'field-checkbox', for: 'wl-estimate' }, [
      estimateInput,
      document.createTextNode(' Estimate'),
    ]),
    h('div', { class: 'form-actions' }, [submitBtn, cancelBtn]),
  ]);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = nameInput.value.trim();
    const price = Number.parseFloat(priceInput.value);
    if (!name || !Number.isFinite(price) || price < 0) return;

    const link = linkInput.value.trim();
    const releaseDate = dateInput.value.trim();
    const draft = {
      name,
      price,
      currency: 'RON' as const,
      link: link || undefined,
      releaseDate: releaseDate || undefined,
      estimate: estimateInput.checked,
    };
    if (editingId) store.update(editingId, draft);
    else store.add(draft);
    resetForm();
  });

  function resetForm(): void {
    editingId = null;
    form.reset();
    submitBtn.textContent = 'Inscribe';
    cancelBtn.hidden = true;
  }

  function startEdit(item: WishlistItem): void {
    editingId = item.id;
    nameInput.value = item.name;
    priceInput.value = String(item.price);
    linkInput.value = item.link ?? '';
    dateInput.value = item.releaseDate ?? '';
    estimateInput.checked = item.estimate;
    submitBtn.textContent = 'Seal changes';
    cancelBtn.hidden = false;
    nameInput.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Containers that get re-rendered on every store change ---------------
  const summary = h('div', { class: 'wl-summary', ariaLabel: 'Wishlist totals' });
  const list = h('ul', { class: 'wl-list' });

  root.append(
    h('p', {
      class: 'wl-intro',
      text: 'Records and relics you hunger for. Claim one when it is in your grasp and it passes to the Reliquary — the tally bleeds down on its own.',
    }),
    form,
    summary,
    list,
  );

  function renderList(items: readonly WishlistItem[]): void {
    clear(list);
    const wanted = [...items].filter((i) => !i.acquired).sort((a, b) => a.createdAt - b.createdAt);

    if (wanted.length === 0) {
      list.append(
        h('li', { class: 'wl-empty', text: 'The ledger lies barren. Inscribe your first want above.' }),
      );
      return;
    }

    for (const item of wanted) {
      list.append(
        buildItemRow(item, store, {
          onEdit: startEdit,
          onRemove: (it) => {
            if (editingId === it.id) resetForm();
            store.remove(it.id);
          },
        }),
      );
    }
  }

  store.subscribe((items) => {
    renderSummary(summary, items, 'wishlist');
    renderList(items);
  });
}

export function mountReliquary(root: HTMLElement, store: WishlistStore): void {
  const summary = h('div', { class: 'wl-summary', ariaLabel: 'Reliquary totals' });
  const list = h('ul', { class: 'wl-list' });

  root.append(
    h('p', {
      class: 'wl-intro',
      text: 'Relics enshrined, the hunt for them done. Unclaim one to cast it back into want.',
    }),
    summary,
    list,
  );

  function renderList(items: readonly WishlistItem[]): void {
    clear(list);
    const claimed = [...items].filter((i) => i.acquired).sort((a, b) => a.createdAt - b.createdAt);

    if (claimed.length === 0) {
      list.append(
        h('li', {
          class: 'wl-empty',
          text: 'The reliquary stands empty. Claim a relic to enshrine it here.',
        }),
      );
      return;
    }

    for (const item of claimed) list.append(buildItemRow(item, store));
  }

  store.subscribe((items) => {
    renderSummary(summary, items, 'reliquary');
    renderList(items);
  });
}
