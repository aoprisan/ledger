import { clear, h } from '../dom.ts';
import type { WishlistItem } from './types.ts';
import type { WishlistStore } from './store.ts';
import { formatMoney, totalsByCurrency } from './totals.ts';

export function mountWishlist(root: HTMLElement, store: WishlistStore): void {
  let editingId: string | null = null;

  // --- Form (built once, reused for both "add" and "edit") -----------------
  const nameInput = h('input', {
    type: 'text',
    id: 'wl-name',
    name: 'name',
    placeholder: 'e.g. Mayhem — box set',
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

  const estimateInput = h('input', { type: 'checkbox', id: 'wl-estimate', name: 'estimate' });

  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary', text: 'Add to wishlist' });
  const cancelBtn = h('button', {
    type: 'button',
    class: 'btn btn-ghost',
    text: 'Cancel',
    on: { click: () => resetForm() },
  });
  cancelBtn.hidden = true;

  const form = h('form', { class: 'wl-form', ariaLabel: 'Add or edit a wishlist item' }, [
    h('div', { class: 'field field-grow' }, [
      h('label', { for: 'wl-name', text: 'Item', class: 'field-label' }),
      nameInput,
    ]),
    h('div', { class: 'field' }, [
      h('label', { for: 'wl-price', text: 'Price (RON)', class: 'field-label' }),
      priceInput,
    ]),
    h('div', { class: 'field field-link' }, [
      h('label', { for: 'wl-link', text: 'Link', class: 'field-label' }),
      linkInput,
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
    const draft = {
      name,
      price,
      currency: 'RON' as const,
      link: link || undefined,
      estimate: estimateInput.checked,
    };
    if (editingId) store.update(editingId, draft);
    else store.add(draft);
    resetForm();
  });

  function resetForm(): void {
    editingId = null;
    form.reset();
    submitBtn.textContent = 'Add to wishlist';
    cancelBtn.hidden = true;
  }

  function startEdit(item: WishlistItem): void {
    editingId = item.id;
    nameInput.value = item.name;
    priceInput.value = String(item.price);
    linkInput.value = item.link ?? '';
    estimateInput.checked = item.estimate;
    submitBtn.textContent = 'Save changes';
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
      text: 'Track gear and records you want. Mark items as acquired once bought — totals update automatically.',
    }),
    form,
    summary,
    list,
  );

  function renderSummary(items: readonly WishlistItem[]): void {
    clear(summary);
    const totals = totalsByCurrency(items);
    if (totals.length === 0) return;

    for (const t of totals) {
      summary.append(
        h('div', { class: 'summary-card' }, [
          h('span', { class: 'summary-currency', text: t.currency }),
          h('span', {
            class: 'summary-remaining',
            text: formatMoney(t.remaining, t.currency),
            title: 'Still to buy',
          }),
          h('span', {
            class: 'summary-total',
            text: `${formatMoney(t.total, t.currency)} total`,
          }),
        ]),
      );
    }
  }

  function renderList(items: readonly WishlistItem[]): void {
    clear(list);

    if (items.length === 0) {
      list.append(
        h('li', { class: 'wl-empty', text: 'Nothing on the wishlist yet — add something above.' }),
      );
      return;
    }

    const sorted = [...items].sort((a, b) => {
      if (a.acquired !== b.acquired) return a.acquired ? 1 : -1;
      return a.createdAt - b.createdAt;
    });

    for (const item of sorted) {
      const checkbox = h('input', {
        type: 'checkbox',
        checked: item.acquired,
        ariaLabel: `Mark "${item.name}" as acquired`,
        on: { change: () => store.toggleAcquired(item.id) },
      });

      const badges = h('span', { class: 'badges' });
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

      const row = h('li', { class: item.acquired ? 'wl-item is-acquired' : 'wl-item' }, [
        h('label', { class: 'wl-check' }, [checkbox]),
        h('div', { class: 'wl-main' }, [
          nameEl,
          badges,
        ]),
        h('span', { class: 'wl-price', text: formatMoney(item.price, item.currency) }),
        h('div', { class: 'wl-actions' }, [
          h('button', {
            type: 'button',
            class: 'btn btn-icon',
            text: 'Edit',
            ariaLabel: `Edit ${item.name}`,
            on: { click: () => startEdit(item) },
          }),
          h('button', {
            type: 'button',
            class: 'btn btn-icon btn-danger',
            text: 'Delete',
            ariaLabel: `Delete ${item.name}`,
            on: {
              click: () => {
                if (confirm(`Remove "${item.name}" from the wishlist?`)) {
                  if (editingId === item.id) resetForm();
                  store.remove(item.id);
                }
              },
            },
          }),
        ]),
      ]);
      list.append(row);
    }
  }

  store.subscribe((items) => {
    renderSummary(items);
    renderList(items);
  });
}
