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
      h('span', { class: 'badge badge-soon', text: 'Coming soon' }),
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
    panel: comingSoon('Income', 'Log earnings and recurring income here.'),
  },
  {
    id: 'expenses',
    label: 'Expenses',
    panel: comingSoon('Expenses', 'Track spending and see where the money goes.'),
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
      h('span', { class: 'brand-mark', ariaLabel: 'Ledger logo' }),
      h('h1', { class: 'brand-title', text: 'Ledger' }),
    ]),
    nav,
  ]),
  panels,
  h('footer', { class: 'app-footer' }, [
    h('span', { text: 'Data is stored locally on this device.' }),
  ]),
);

activate('wishlist');
