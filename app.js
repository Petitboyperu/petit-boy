const DATA_URL = "data/store.json";
const CART_KEY = "petit-boy-cart-v1";
const money = value => `S/ ${Number(value || 0).toFixed(2)}`;
const cents = value => Math.round(Number(value || 0) * 100);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const safeUrl = value => {
  try { const url = new URL(value, location.href); return ["http:", "https:"].includes(url.protocol) ? url.href : "#"; }
  catch { return "#"; }
};
const $ = selector => document.querySelector(selector);
const state = {
  store: null,
  category: "todos",
  search: "",
  cart: readCart(),
  detailId: null,
  detailQty: 1,
  form: { name: "", phone: "", delivery: "pickup", address: "", district: "", reference: "", date: "", time: "", generalNote: "", coupon: "" },
  appliedCoupon: null
};

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch { /* A damaged saved cart starts empty. */ }
  return {};
}
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); }
function product(id) { return state.store?.products.find(item => item.id === id); }
function cartEntries() { return Object.entries(state.cart).map(([id, line]) => ({ item: product(id), line })).filter(entry => entry.item && entry.item.available && entry.line.quantity > 0); }
function subtotalCents() { return cartEntries().reduce((sum, { item, line }) => sum + cents(item.price) * line.quantity, 0); }
function discountCents() {
  const coupon = state.appliedCoupon;
  if (!coupon) return 0;
  const subtotal = subtotalCents();
  return Math.min(subtotal, coupon.type === "percent" ? Math.round(subtotal * Number(coupon.value) / 100) : cents(coupon.value));
}
function totalCents() { return subtotalCents() - discountCents(); }
function cartCount() { return cartEntries().reduce((sum, { line }) => sum + line.quantity, 0); }
function toast(message) { const node = $("#toast"); node.textContent = message; node.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("show"), 2200); }
function imageMarkup(item, attrs = "") { return `<img src="${escapeHtml(safeUrl(item.image))}" alt="Imagen ilustrativa de ${escapeHtml(item.name)}" loading="lazy" ${attrs} onerror="this.src='assets/logo.png'">`; }

async function start() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo");
    state.store = await response.json();
    for (const id of Object.keys(state.cart)) {
      if (!product(id) || !product(id).available || !Number.isInteger(state.cart[id].quantity) || state.cart[id].quantity < 1) delete state.cart[id];
    }
    saveCart();
    fillLinks();
    renderAll();
  } catch {
    $("#product-grid").innerHTML = `<div class="loading">No pudimos cargar el menú. Revisa tu conexión y vuelve a intentarlo.</div>`;
    $("#featured-section").hidden = true;
  }
}
function fillLinks() {
  const config = state.store.config;
  const phone = String(config.whatsappNumber || "").replace(/\D/g, "");
  const whatsapp = phone ? `https://wa.me/${phone}` : "#";
  for (const [selector, url] of [["#header-instagram", config.instagramUrl], ["#footer-instagram", config.instagramUrl], ["#instagram-cta", config.instagramUrl], ["#header-whatsapp", whatsapp], ["#footer-whatsapp", whatsapp], ["#maps-link", config.mapsUrl], ["#reviews-link", config.reviewsUrl], ["#footer-reviews", config.reviewsUrl]]) $(selector).href = safeUrl(url);
}
function renderAll() { renderCategories(); renderFeatured(); renderProducts(); renderCartBadge(); }
function renderCategories() {
  $("#category-list").innerHTML = state.store.categories.filter(c => c.active).sort((a,b) => a.order-b.order).map(category => `<button type="button" class="category-chip" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id === state.category}">${category.emoji ? `${escapeHtml(category.emoji)} ` : ""}${escapeHtml(category.name)}</button>`).join("");
}
function renderFeatured() {
  const section = $("#featured-section");
  section.hidden = state.category !== "todos" || Boolean(state.search);
  const items = state.store.products.filter(item => item.featured && item.available).sort((a,b) => a.order-b.order);
  if (!items.length) { section.hidden = true; return; }
  $("#featured-list").innerHTML = items.map(item => `<button class="featured-card" type="button" data-detail="${escapeHtml(item.id)}">${imageMarkup(item)}<span><strong>${escapeHtml(item.name)}</strong><span>${money(item.price)}</span></span></button>`).join("");
}
function renderProducts() {
  const category = state.store.categories.find(c => c.id === state.category);
  $("#product-heading").textContent = state.category === "todos" ? "Todo el menú" : category?.name || "Productos";
  const query = state.search.trim().toLocaleLowerCase("es-PE");
  const items = state.store.products.filter(item => (state.category === "todos" || item.category === state.category) && item.name.toLocaleLowerCase("es-PE").includes(query)).sort((a,b) => a.order-b.order);
  $("#product-count").textContent = `${items.length} ${items.length === 1 ? "producto" : "productos"}`;
  $("#product-grid").innerHTML = items.map(item => {
    const quantity = state.cart[item.id]?.quantity || 0;
    return `<article class="product-card"><button type="button" class="product-image-button" data-detail="${escapeHtml(item.id)}" aria-label="Ver ${escapeHtml(item.name)}">${imageMarkup(item)}${!item.available ? '<span class="sold-out">AGOTADO POR HOY</span>' : ""}</button><div class="product-body"><button type="button" class="product-name" data-detail="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button><p>${escapeHtml(item.description)}</p><div class="product-bottom"><span class="price">${money(item.price)}</span>${!item.available ? '<button class="add-button" disabled>Agotado</button>' : quantity ? `<div class="mini-quantity" aria-label="Cantidad de ${escapeHtml(item.name)}"><button type="button" data-minus="${escapeHtml(item.id)}" aria-label="Quitar uno">−</button><span>${quantity}</span><button type="button" data-plus="${escapeHtml(item.id)}" aria-label="Agregar uno">+</button></div>` : `<button type="button" class="add-button" data-plus="${escapeHtml(item.id)}">+ Agregar</button>`}</div></div></article>`;
  }).join("");
  const empty = $("#empty-state");
  empty.hidden = items.length > 0;
  if (!items.length) {
    empty.querySelector("h3").textContent = state.category === "empanadas" && !query ? "Pronto habrá empanadas en el menú" : "No encontramos ese antojo";
    empty.querySelector("p").textContent = state.category === "empanadas" && !query ? "Estamos preparando esta parte del catálogo." : "Prueba buscando otro producto o cambia la categoría.";
  }
}
function renderCartBadge() {
  const count = cartCount();
  $("#header-count").textContent = count;
  $("#floating-cart").hidden = count === 0;
  $("#floating-summary").textContent = `${count} ${count === 1 ? "producto" : "productos"} · ${money(totalCents()/100)}`;
}
function changeQuantity(id, change) {
  const item = product(id);
  if (!item || !item.available) return;
  const old = state.cart[id]?.quantity || 0;
  const next = Math.max(0, old + change);
  if (next) state.cart[id] = { quantity: next, note: state.cart[id]?.note || "" };
  else delete state.cart[id];
  saveCart(); renderProducts(); renderCartBadge();
  if ($("#cart-dialog").open) renderCart();
  toast(change > 0 ? "¡Agregado! ♡" : "Pedido actualizado");
}
function openDetail(id) {
  const item = product(id);
  if (!item) return;
  state.detailId = id; state.detailQty = 1;
  $("#product-dialog-content").innerHTML = `${imageMarkup(item, 'class="detail-image"')}<div class="detail-body"><span class="eyebrow">${escapeHtml(state.store.categories.find(c => c.id === item.category)?.name || "PETIT BOY")}</span><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.description)}</p><strong class="price">${money(item.price)}</strong>${item.available ? `<div class="detail-controls"><span>Cantidad</span><div class="quantity"><button type="button" id="detail-minus" aria-label="Quitar uno">−</button><span id="detail-count">1</span><button type="button" id="detail-plus" aria-label="Agregar uno">+</button></div></div><label>Observaciones para este producto<textarea id="detail-note" placeholder="Ej.: Sin nueces, por favor."></textarea></label><button type="button" class="primary-button" id="detail-add">Agregar al pedido · ${money(item.price)}</button>` : '<p><strong>AGOTADO POR HOY</strong></p>'}</div>`;
  $("#product-dialog").showModal();
}
function renderCart() {
  const entries = cartEntries();
  if (!entries.length) {
    $("#cart-dialog-content").innerHTML = `<div class="cart-empty"><span>🛒</span><h3>Tu carrito está esperando algo rico.</h3><button type="button" class="primary-button" data-close="cart-dialog">Ver el menú</button></div>`;
    return;
  }
  const lines = entries.map(({ item, line }) => `<div class="cart-item">${imageMarkup(item)}<div><div class="cart-item-top"><strong>${escapeHtml(item.name)}</strong><strong>${money(cents(item.price)*line.quantity/100)}</strong></div><small>${money(item.price)} c/u</small><div class="cart-item-actions"><div class="mini-quantity"><button type="button" data-minus="${escapeHtml(item.id)}" aria-label="Quitar uno">−</button><span>${line.quantity}</span><button type="button" data-plus="${escapeHtml(item.id)}" aria-label="Agregar uno">+</button></div><button type="button" class="remove-button" data-remove="${escapeHtml(item.id)}">Eliminar</button></div><textarea data-note="${escapeHtml(item.id)}" aria-label="Observaciones para ${escapeHtml(item.name)}" placeholder="Observaciones para este producto">${escapeHtml(line.note || "")}</textarea></div></div>`).join("");
  const form = state.form;
  $("#cart-dialog-content").innerHTML = `${lines}<div class="summary-box"><div class="summary-row"><span>Subtotal</span><strong>${money(subtotalCents()/100)}</strong></div><div class="summary-row"><span>Delivery</span><span>${form.delivery === "delivery" ? "Por confirmar" : money(0)}</span></div><div class="summary-row"><span>Descuento</span><span>− ${money(discountCents()/100)}</span></div><div class="summary-row total"><span>Total productos</span><span>${money(totalCents()/100)}</span></div>${form.delivery === "delivery" ? '<p class="summary-note">El costo de delivery será confirmado por WhatsApp.</p>' : ""}</div><form id="checkout-form" class="checkout-form"><h3>Datos para tu pedido</h3><div class="form-grid"><label>Tu nombre *<input name="name" value="${escapeHtml(form.name)}" required autocomplete="name" maxlength="80"></label><label>Teléfono (opcional)<input name="phone" type="tel" value="${escapeHtml(form.phone)}" autocomplete="tel" maxlength="30"></label></div><div class="delivery-options"><label><input type="radio" name="delivery" value="pickup" ${form.delivery === "pickup" ? "checked" : ""}> Recojo en tienda</label><label><input type="radio" name="delivery" value="delivery" ${form.delivery === "delivery" ? "checked" : ""}> Delivery</label></div><div id="delivery-fields">${form.delivery === "delivery" ? `<label>Dirección *<input name="address" value="${escapeHtml(form.address)}" required autocomplete="street-address" maxlength="160"></label><div class="form-grid"><label>Distrito *<input name="district" value="${escapeHtml(form.district)}" required maxlength="80"></label><label>Referencia<input name="reference" value="${escapeHtml(form.reference)}" maxlength="160"></label></div><span class="field-hint">El costo de delivery será confirmado por WhatsApp.</span>` : '<p class="field-hint">Recojo en Jr. Grau 440, Magdalena del Mar.</p>'}</div><div class="form-grid"><label>Fecha aproximada<input name="date" type="date" min="${todayLocal()}" value="${escapeHtml(form.date)}"></label><label>Hora aproximada<input name="time" type="time" value="${escapeHtml(form.time)}"></label></div><label>¿Quieres indicarnos algo?<textarea name="generalNote" maxlength="500" placeholder="Ej.: Es para regalo, tocar el timbre…">${escapeHtml(form.generalNote)}</textarea></label><label>¿Tienes un cupón?<span class="coupon-row"><input name="coupon" value="${escapeHtml(form.coupon)}" placeholder="Código de cupón"><button id="apply-coupon" type="button">Aplicar</button></span></label><button class="primary-button" type="submit">Revisar pedido · ${money(totalCents()/100)}</button></form>`;
  if (form.delivery === "delivery") for (const note of $("#cart-dialog-content").querySelectorAll(".summary-note,.field-hint")) note.textContent = state.store.config.deliveryNote || "El costo de delivery será confirmado por WhatsApp.";
}
function todayLocal() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; }
function applyCoupon() {
  const code = state.form.coupon.trim().toUpperCase();
  const coupon = state.store.coupons.find(item => item.active && item.code.toUpperCase() === code && (!item.expires || item.expires >= todayLocal()));
  if (!coupon || !code) { state.appliedCoupon = null; toast("Cupón no disponible"); }
  else { state.appliedCoupon = coupon; toast("Cupón aplicado"); }
  renderCart(); renderCartBadge();
}
function orderMessage() {
  const form = state.form;
  const parts = cartEntries().map(({ item, line }) => `• ${line.quantity} × ${item.name}\n${money(item.price)} c/u\nSubtotal: ${money(cents(item.price)*line.quantity/100)}${line.note?.trim() ? `\nObservación: ${line.note.trim()}` : ""}`).join("\n\n");
  return `🧡 *NUEVO PEDIDO PETIT BOY* 🧡\n\n${state.store.config.orderIntro || "Hola PETIT BOY 👋\nQuisiera realizar el siguiente pedido:"}\n\n━━━━━━━━━━━━━━\n\n🍰 *PRODUCTOS*\n\n${parts}\n\n━━━━━━━━━━━━━━\n\n💰 *RESUMEN*\n\nSubtotal: ${money(subtotalCents()/100)}\nDelivery: ${form.delivery === "delivery" ? "Por confirmar" : money(0)}\nDescuento: ${money(discountCents()/100)}\n*TOTAL PRODUCTOS: ${money(totalCents()/100)}*\n\n━━━━━━━━━━━━━━\n\n👤 *CLIENTE*\n\nNombre: ${form.name.trim()}${form.phone.trim() ? `\nTeléfono: ${form.phone.trim()}` : ""}\nModalidad: ${form.delivery === "delivery" ? "Delivery" : "Recojo en tienda"}${form.delivery === "delivery" ? `\nDirección: ${form.address.trim()}\nDistrito: ${form.district.trim()}${form.reference.trim() ? `\nReferencia: ${form.reference.trim()}` : ""}` : `\nLugar de recojo: ${state.store.config.address}`}\nFecha: ${form.date || "Por coordinar"}\nHora: ${form.time || "Por coordinar"}${form.generalNote.trim() ? `\nObservaciones: ${form.generalNote.trim()}` : ""}\n\n━━━━━━━━━━━━━━\n\n🧡 Pedido realizado desde el menú digital de *PETIT BOY*.`;
}
function reviewOrder() {
  const number = String(state.store.config.whatsappNumber || "").replace(/\D/g, "");
  const message = orderMessage();
  const url = number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "#";
  $("#confirm-content").innerHTML = `<span class="eyebrow">UN PASO MÁS</span><h2>¡Tu pedido está listo! ♡</h2><p>Revisa que todo esté correcto antes de enviarlo.</p><div class="confirm-list">${escapeHtml(message)}</div><div class="confirm-actions"><button type="button" class="secondary-button" id="edit-order">← Editar pedido</button><a class="primary-button" id="send-whatsapp" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;${number ? "" : "pointer-events:none;opacity:.5"}">Confirmar por WhatsApp</a></div><p class="confirm-footnote">Tu pedido quedará confirmado cuando PETIT BOY responda por WhatsApp.</p>`;
  $("#cart-dialog").close();
  $("#confirm-dialog").showModal();
}

document.addEventListener("click", event => {
  const target = event.target.closest("button,a");
  if (!target) return;
  if (target.dataset.close) { $(`#${target.dataset.close}`).close(); return; }
  if (target.dataset.categoryJump) { state.category = target.dataset.categoryJump; state.search = ""; $("#search").value = ""; renderAll(); $("#menu").scrollIntoView({ behavior: "smooth" }); return; }
  if (target.dataset.category) { state.category = target.dataset.category; renderCategories(); renderFeatured(); renderProducts(); return; }
  if (target.dataset.detail) { openDetail(target.dataset.detail); return; }
  if (target.dataset.plus) { changeQuantity(target.dataset.plus, 1); return; }
  if (target.dataset.minus) { changeQuantity(target.dataset.minus, -1); return; }
  if (target.dataset.remove) { delete state.cart[target.dataset.remove]; saveCart(); renderProducts(); renderCartBadge(); renderCart(); toast("Producto eliminado"); return; }
  if (target.id === "header-cart" || target.id === "floating-cart") { renderCart(); $("#cart-dialog").showModal(); return; }
  if (target.id === "detail-plus" || target.id === "detail-minus") { state.detailQty = Math.max(1, state.detailQty + (target.id === "detail-plus" ? 1 : -1)); $("#detail-count").textContent = state.detailQty; $("#detail-add").textContent = `Agregar al pedido · ${money(cents(product(state.detailId).price)*state.detailQty/100)}`; return; }
  if (target.id === "detail-add") { const id = state.detailId; const note = $("#detail-note").value.trim(); state.cart[id] = { quantity: (state.cart[id]?.quantity || 0) + state.detailQty, note: note || state.cart[id]?.note || "" }; saveCart(); $("#product-dialog").close(); renderProducts(); renderCartBadge(); toast("¡Agregado! ♡"); return; }
  if (target.id === "apply-coupon") { applyCoupon(); return; }
  if (target.id === "edit-order") { $("#confirm-dialog").close(); renderCart(); $("#cart-dialog").showModal(); return; }
});
$("#search").addEventListener("input", event => { state.search = event.target.value; renderFeatured(); renderProducts(); });
$("#cart-dialog").addEventListener("input", event => {
  const target = event.target;
  if (target.dataset.note) { if (state.cart[target.dataset.note]) { state.cart[target.dataset.note].note = target.value; saveCart(); } return; }
  if (target.name && target.name in state.form) {
    state.form[target.name] = target.value;
    if (target.name === "coupon") state.appliedCoupon = null;
  }
});
$("#cart-dialog").addEventListener("change", event => { if (event.target.name === "delivery") { state.form.delivery = event.target.value; renderCart(); } });
$("#cart-dialog").addEventListener("submit", event => {
  if (event.target.id !== "checkout-form") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  if (!cartEntries().length) return;
  reviewOrder();
});
for (const dialog of document.querySelectorAll("dialog")) dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
start();
