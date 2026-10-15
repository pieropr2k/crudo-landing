(() => {
  const products = [
    { id: 'buzo', name: 'Buzo Crudo', price: 89000, image: 'assets/producto-buzo.png', badge: 'Nuevo', drop: 'DROP_01', stock: '23/100', kind: 'Buzos', desc: 'Buzo oversize en frisa pesada. Logo estampado desgastado al frente, etiqueta numerada en el bolsillo. Tirada de 100.' },
    { id: 'gorra', name: 'Gorra Dad', price: 32000, image: 'assets/producto-gorra.png', badge: 'Últimas', drop: 'DROP_01', stock: '12/150', kind: 'Gorras', desc: 'Gorra de seis paneles, bordado en relieve. Tirada de 150. Cuando vuela, voló.' },
    { id: 'remera', name: 'Remera Oversize', price: 45000, image: 'assets/lifestyle-calle.png', drop: 'DROP_00', kind: 'Remeras', soldOut: true, desc: 'Remera oversize, estampa grande en la espalda. Agotada.' }
  ];
  const KINDS = ['Todo', 'Buzos', 'Remeras', 'Gorras'];
  const SIZES = ['S', 'M', 'L', 'XL'];
  const state = { view: 'home', pid: 'buzo', size: 'M', tab: 'Todo', cart: [], menuOpen: false };

  const $ = id => document.getElementById(id);
  const fmt = n => '$' + n.toLocaleString('es-AR');
  const find = id => products.find(p => p.id === id);
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => n.append(c));
    return n;
  };

  let toastTimer;
  const say = msg => {
    $('toast-msg').textContent = msg; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
  };

  // Rutas por hash: #/  #/shop  #/shop/Buzos  #/producto/buzo
  let pendingAnchor = null;
  const pathFor = (view, pid, tab) =>
    view === 'product' ? '#/producto/' + pid : view === 'shop' ? '#/shop' + (tab && tab !== 'Todo' ? '/' + tab : '') : '#/';
  const scrollToAnchor = anchor => {
    const target = anchor && $(anchor);
    window.scrollTo({ top: target ? target.getBoundingClientRect().top + window.scrollY - 70 : 0 });
  };

  function go(view, pid, anchor, tab) {
    state.menuOpen = false;
    $('cart').hidden = true;
    if (anchor === 'contacto') { renderNav(); return scrollToAnchor(anchor); }
    pendingAnchor = anchor || null;
    const hash = pathFor(view, pid || state.pid, tab);
    if (location.hash === hash || (hash === '#/' && !location.hash)) route();
    else location.hash = hash;
  }

  function route() {
    const [, section, arg] = decodeURIComponent(location.hash).split('/');
    const prevPid = state.pid;
    if (section === 'producto' && find(arg)) { state.view = 'product'; state.pid = arg; }
    else if (section === 'shop') { state.view = 'shop'; state.tab = KINDS.includes(arg) ? arg : 'Todo'; }
    else state.view = 'home';
    if (state.view !== 'product' || state.pid !== prevPid) state.size = 'M';
    state.menuOpen = false;
    $('cart').hidden = true;
    render();
    scrollToAnchor(pendingAnchor);
    pendingAnchor = null;
  }

  function addToCart(p, size) {
    if (p.soldOut) return;
    state.cart.push({ id: p.id, size: p.kind === 'Gorras' ? 'único' : size });
    renderCart(); say(p.name + ' al carrito. Apurate.');
  }

  function card(p) {
    const meta = (p.drop || p.stock) && el('div', { class: 'cr-pc__meta' }, p.drop || '', p.drop && p.stock ? ' / ' : '', p.stock ? el('b', {}, p.stock) : '');
    const open = e => { e.preventDefault(); go('product', p.id); };
    return el('article', { class: 'cr-pc' + (p.soldOut ? ' cr-pc--soldout' : '') },
      el('a', { href: pathFor('product', p.id), class: 'cr-pc__link', onclick: open, 'aria-label': 'Ver más detalle de ' + p.name },
        el('div', { class: 'cr-pc__img' },
          el('img', { src: p.image, alt: p.name }),
          p.badge && !p.soldOut && el('span', { class: 'cr-pc__badge' }, el('span', { class: 'cr-badge cr-badge--volt' }, p.badge)),
          p.soldOut && el('div', { class: 'cr-pc__soldout' }, 'Agotado'),
          el('div', { class: 'cr-pc__hover' }, el('span', {}, 'Ver más detalle →'))),
        el('div', { class: 'cr-pc__row' }, el('span', { class: 'cr-pc__name' }, p.name), el('span', { class: 'cr-pc__price' }, fmt(p.price))),
        meta || ''),
      el('button', { type: 'button', class: 'cr-btn cr-btn--primary cr-btn--full', disabled: !!p.soldOut, onclick: () => addToCart(p, 'M') },
        p.soldOut ? 'Agotado' : 'Añadir al carrito'));
  }
  const fill = (node, kids) => node.replaceChildren(...kids.filter(Boolean));

  function renderNav() {
    const links = [['Shop', 'shop', null, state.view === 'shop'], ['Drops', 'home', 'drops'], ['Nosotros', 'home', 'nosotros'], ['Contacto', state.view, 'contacto']];
    fill($('nav'), links.map(([label, view, anchor, cur]) => el('a', { href: '#', class: 'cr-nav__link', 'aria-current': cur ? 'page' : undefined, onclick: e => { e.preventDefault(); go(view, null, anchor); } }, label)));
    $('nav').classList.toggle('cw-open', state.menuOpen);
    $('burger').classList.toggle('cw-on', state.menuOpen);
    $('burger').setAttribute('aria-expanded', state.menuOpen);
  }

  function renderShop() {
    const list = products.filter(p => state.tab === 'Todo' || p.kind === state.tab);
    $('shop-count').textContent = list.length;
    fill($('tabs'), KINDS.map(k => el('button', { class: 'cr-tab', role: 'tab', 'aria-selected': String(k === state.tab), onclick: () => go('shop', null, null, k) }, k)));
    fill($('shop-grid'), list.map(card));
    $('shop-empty').hidden = list.length > 0;
  }

  function renderProduct() {
    const p = find(state.pid);
    const [left, tot] = (p.stock || '').split('/').map(Number);
    const img = $('p-img');
    img.style.backgroundImage = `url(${p.image})`; img.style.filter = p.soldOut ? 'grayscale(1) brightness(.5)' : 'none'; img.setAttribute('aria-label', p.name);
    $('p-badge').hidden = !p.badge || !!p.soldOut; $('p-badge').textContent = p.badge || '';
    $('p-drop').textContent = p.drop; $('p-name').textContent = p.name; $('p-price').textContent = fmt(p.price); $('p-desc').textContent = p.desc;
    $('p-stock-wrap').hidden = !p.stock || !!p.soldOut;
    if (p.stock) { $('p-stock').textContent = left + ' / ' + tot; $('p-bar').style.width = Math.round(left / tot * 100) + '%'; }
    $('p-sizes-wrap').hidden = p.kind === 'Gorras' || !!p.soldOut;
    fill($('p-sizes'), SIZES.map(z => el('button', { type: 'button', class: 'cr-tag', 'aria-pressed': String(state.size === z), onclick: () => { state.size = z; renderProduct(); } }, z)));
    const add = $('p-add'); add.disabled = !!p.soldOut;
    add.replaceChildren(p.soldOut ? 'Agotado' : 'Agregar al carrito', ...(p.soldOut ? [] : [el('span', { 'aria-hidden': 'true' }, '→')]));
    fill($('p-others'), products.filter(x => x.id !== p.id).map(card));
  }

  function renderCart() {
    const n = state.cart.length;
    $('cart-count').textContent = n; $('cart-count2').textContent = n; $('cart-dot').hidden = !n;
    $('pay').disabled = !n;
    $('cart-total').textContent = fmt(state.cart.reduce((a, i) => a + find(i.id).price, 0));
    const items = state.cart.map((i, k) => {
      const q = find(i.id);
      return el('div', { style: 'display:flex;gap:16px;align-items:center;border-bottom:1px solid var(--border-1);padding-bottom:16px' },
        el('div', { style: `width:72px;height:90px;flex:none;background:var(--bg-surface) url(${q.image}) center/cover no-repeat` }),
        el('div', { class: 'cw-col', style: 'flex:1;gap:6px;min-width:0' }, el('span', { class: 't-h4' }, q.name), el('span', { class: 't-label', style: 'color:var(--fg-2)' }, `${q.drop} · talle ${i.size}`), el('span', { class: 't-mono' }, fmt(q.price))),
        el('button', { class: 't-label', style: 'background:none;border:0;color:var(--fg-2);cursor:pointer', onclick: () => { state.cart.splice(k, 1); renderCart(); } }, 'Sacar'));
    });
    fill($('cart-items'), items.length ? items : [el('p', { class: 't-mono', style: 'color:var(--fg-2);margin:0' }, 'Vacío. Y lo que se va, no vuelve.')]);
  }

  function renderFooter() {
    fill($('foot-shop'), KINDS.map(k => el('a', { href: '#', class: 't-mono cw-foot-link', onclick: e => { e.preventDefault(); go('shop', null, null, k); } }, k)));
    fill($('foot-brand'), [['Drops', 'home', 'drops'], ['Nosotros', 'home', 'nosotros'], ['Contacto', state.view, 'contacto']].map(([l, v, a]) => el('a', { href: '#', class: 't-mono cw-foot-link', onclick: e => { e.preventDefault(); go(v, null, a); } }, l)));
  }

  function render() {
    $('view-home').hidden = state.view !== 'home';
    $('view-shop').hidden = state.view !== 'shop';
    $('view-product').hidden = state.view !== 'product';
    renderNav(); renderFooter(); renderCart();
    if (state.view === 'home') fill($('home-grid'), products.map(card));
    if (state.view === 'shop') renderShop();
    if (state.view === 'product') renderProduct();
  }

  // static wiring
  const t = 'SIN FILTRO. SIN POSES. SIN VUELTAS. / ';
  $('ticker').textContent = t.repeat(20);
  document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.go); }));
  $('burger').addEventListener('click', () => { state.menuOpen = !state.menuOpen; renderNav(); });
  $('open-cart').addEventListener('click', () => { $('cart').hidden = false; });
  $('close-cart').addEventListener('click', () => { $('cart').hidden = true; });
  $('cart').addEventListener('click', () => { $('cart').hidden = true; });
  $('cart-panel').addEventListener('click', e => e.stopPropagation());
  $('toast-x').addEventListener('click', () => { $('toast').hidden = true; });
  $('to-top').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('p-add').addEventListener('click', () => addToCart(find(state.pid), state.size));
  window.addEventListener('hashchange', route);
  $('pay').addEventListener('click', () => { state.cart = []; $('cart').hidden = true; renderCart(); say('Pedido recibido. Te llega el detalle por mail.'); });
  $('sub').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('email');
    if (!/\S+@\S+\.\S+/.test(input.value)) return say('Mail inválido. Revisalo.');
    input.value = ''; say('Anotado. Te avisamos antes que a nadie.');
  });

  $('nav').classList.add('intro'); setTimeout(() => $('nav').classList.remove('intro'), 1200);
  const header = document.querySelector('.cw-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  route();
})();
