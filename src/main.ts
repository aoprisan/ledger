import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { h } from './dom.ts';
import { WishlistStore } from './wishlist/store.ts';
import { mountWishlist } from './wishlist/view.ts';

registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app root element is missing');

interface Tab {
  id: string;
  label: string;
  panel: HTMLElement;
}

function comingSoon(title: string, blurb: string): HTMLElement {
  return h('section', { class: 'panel panel-soon' }, [
    h('div', { class: 'soon-card' }, [
      h('h2', { text: title }),
      h('p', { text: blurb }),
      h('span', { class: 'badge badge-soon', text: 'Not yet summoned' }),
    ]),
  ]);
}

const wishlistPanel = h('section', { class: 'panel' });
mountWishlist(wishlistPanel, new WishlistStore());

const tabs: Tab[] = [
  { id: 'wishlist', label: 'Wishlist', panel: wishlistPanel },
  {
    id: 'income',
    label: 'Income',
    panel: comingSoon('Income', 'Earnings and recurring tithes will be tallied here. The rite is not yet complete.'),
  },
  {
    id: 'expenses',
    label: 'Expenses',
    panel: comingSoon('Expenses', 'Where the coin bleeds out — soon to be reckoned in full. The rite is not yet complete.'),
  },
];

const nav = h('nav', { class: 'tabs', ariaLabel: 'Sections' });
const panels = h('main', { class: 'panels' });
const buttons = new Map<string, HTMLButtonElement>();

function activate(id: string): void {
  for (const tab of tabs) {
    const isActive = tab.id === id;
    tab.panel.hidden = !isActive;
    const btn = buttons.get(tab.id);
    if (btn) {
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
  }
}

for (const tab of tabs) {
  const btn = h('button', {
    type: 'button',
    class: 'tab',
    text: tab.label,
    on: { click: () => activate(tab.id) },
  });
  buttons.set(tab.id, btn);
  nav.append(btn);
  panels.append(tab.panel);
}

app.append(
  h('header', { class: 'app-header' }, [
    h('div', { class: 'brand' }, [
      h('span', { class: 'brand-mark', ariaLabel: 'Ledger sigil' }),
      h('div', { class: 'brand-text' }, [
        h('h1', { class: 'brand-title', text: 'Ledger' }),
        h('p', { class: 'brand-tag', text: 'Grimoire of relics & records' }),
      ]),
    ]),
    nav,
  ]),
  panels,
  h('footer', { class: 'app-footer' }, [
    h('span', { text: 'All sins recorded locally — nothing leaves this device.' }),
  ]),
);

activate('wishlist');
