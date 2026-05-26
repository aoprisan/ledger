type Props = {
  class?: string;
  text?: string;
  type?: string;
  value?: string;
  name?: string;
  id?: string;
  for?: string;
  href?: string;
  target?: string;
  rel?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  required?: boolean;
  checked?: boolean;
  ariaLabel?: string;
  title?: string;
  dataset?: Record<string, string>;
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (ev: HTMLElementEventMap[K]) => void }>;
};

/** Minimal typed element factory: `h('button', { class: 'x', text: 'Go' })`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: className, text, ariaLabel, dataset, on, ...attrs } = props;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (ariaLabel) node.setAttribute('aria-label', ariaLabel);

  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === false) continue;
    if (val === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(val));
  }

  if (dataset) for (const [k, v] of Object.entries(dataset)) node.dataset[k] = v;

  if (on) {
    for (const [event, handler] of Object.entries(on)) {
      node.addEventListener(event, handler as EventListener);
    }
  }

  for (const child of children) node.append(child);
  return node;
}

export function clear(node: Element): void {
  node.replaceChildren();
}
