const DRAFT_KEY = "petit-boy-admin-draft-v1";
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const slug = value => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const status = message => { $("#status").textContent = message; };
let store;
let editing;

async function start() {
  try {
    const response = await fetch("../data/store.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
    const published = await response.json();
    try { store = JSON.parse(localStorage.getItem(DRAFT_KEY)) || published; }
    catch { store = published; }
    render();
    if (localStorage.getItem(DRAFT_KEY)) status("Tienes un borrador guardado en este navegador.");
  } catch { status("No se pudo cargar el catálogo. Abre la app desde un servidor local o GitHub Pages."); }
}
function save() { localStorage.setItem(DRAFT_KEY, JSON.stringify(store)); render(); status("Borrador guardado. Descarga el JSON para publicarlo."); }
function imagePath(path) { return /^https?:\/\//i.test(path || "") ? path : `../${path || "assets/logo.png"}`; }
function render() {
  $("#products-table").innerHTML = [...store.products].sort((a,b) => a.order-b.order).map(item => `<tr><td><img src="${escapeHtml(imagePath(item.image))}" alt=""><strong>${escapeHtml(item.name)}</strong></td><td>S/ ${Number(item.price).toFixed(2)}</td><td>${escapeHtml(store.categories.find(c => c.id === item.category)?.name || item.category)}</td><td><span class="badge ${item.available ? "" : "off"}">${item.available ? "Sí" : "Agotado"}</span></td><td>${item.featured ? "Sí" : "No"}</td><td>${Number(item.order)}</td><td><button data-edit="product" data-id="${escapeHtml(item.id)}">Editar</button> <button class="danger" data-delete="product" data-id="${escapeHtml(item.id)}">Eliminar</button></td></tr>`).join("");
  $("#categories-table").innerHTML = [...store.categories].sort((a,b) => a.order-b.order).map(item => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.emoji)}</td><td><span class="badge ${item.active ? "" : "off"}">${item.active ? "Sí" : "No"}</span></td><td>${Number(item.order)}</td><td><button data-edit="category" data-id="${escapeHtml(item.id)}">Editar</button>${item.id !== "todos" ? ` <button class="danger" data-delete="category" data-id="${escapeHtml(item.id)}">Eliminar</button>` : ""}</td></tr>`).join("");
  $("#coupons-table").innerHTML = store.coupons.map(item => `<tr><td><strong>${escapeHtml(item.code)}</strong></td><td>${item.type === "percent" ? "Porcentaje" : "Monto fijo"}</td><td>${Number(item.value)}${item.type === "percent" ? "%" : " soles"}</td><td>${escapeHtml(item.expires || "Sin fecha")}</td><td><span class="badge ${item.active ? "" : "off"}">${item.active ? "Sí" : "No"}</span></td><td><button data-edit="coupon" data-id="${escapeHtml(item.code)}">Editar</button> <button class="danger" data-delete="coupon" data-id="${escapeHtml(item.code)}">Eliminar</button></td></tr>`).join("");
  for (const [key, value] of Object.entries(store.config)) { const field = $(`#config-form [name="${key}"]`); if (field) field.value = value ?? ""; }
}
function openEditor(type, id = null) {
  editing = { type, id };
  const item = type === "product" ? store.products.find(p => p.id === id) : type === "category" ? store.categories.find(c => c.id === id) : store.coupons.find(c => c.code === id);
  $("#editor-title").textContent = `${id ? "Editar" : "Nuevo"} ${type === "product" ? "producto" : type === "category" ? "categoría" : "cupón"}`;
  if (type === "product") {
    $("#editor-fields").innerHTML = `<label>Nombre<input name="name" required maxlength="100" value="${escapeHtml(item?.name || "")}"></label><label>Precio en soles<input name="price" type="number" min="0" step="0.01" required value="${item?.price ?? ""}"></label><label>Categoría<select name="category">${store.categories.filter(c => c.id !== "todos").map(c => `<option value="${escapeHtml(c.id)}" ${c.id === item?.category ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Orden<input name="order" type="number" min="1" required value="${item?.order ?? store.products.length+1}"></label><label>Imagen (ruta o URL)<input name="image" value="${escapeHtml(item?.image || "")}" placeholder="assets/products/mi-producto.webp"></label><label>Descripción<textarea name="description" rows="3" maxlength="250">${escapeHtml(item?.description || "")}</textarea></label><label><input name="available" type="checkbox" ${item?.available ?? true ? "checked" : ""}> Disponible</label><label><input name="featured" type="checkbox" ${item?.featured ? "checked" : ""}> Destacado</label>`;
  } else if (type === "category") {
    $("#editor-fields").innerHTML = `<label>Nombre<input name="name" required maxlength="60" value="${escapeHtml(item?.name || "")}"></label><label>Icono opcional<input name="emoji" maxlength="4" value="${escapeHtml(item?.emoji || "")}"></label><label>Orden<input name="order" type="number" min="0" required value="${item?.order ?? store.categories.length}"></label><label><input name="active" type="checkbox" ${item?.active ?? true ? "checked" : ""}> Activa</label>`;
  } else {
    $("#editor-fields").innerHTML = `<label>Código<input name="code" required maxlength="30" value="${escapeHtml(item?.code || "")}"></label><label>Tipo<select name="type"><option value="percent" ${item?.type === "percent" ? "selected" : ""}>Porcentaje</option><option value="fixed" ${item?.type === "fixed" ? "selected" : ""}>Monto fijo en soles</option></select></label><label>Valor<input name="value" type="number" min="0" step="0.01" required value="${item?.value ?? ""}"></label><label>Vencimiento (opcional)<input name="expires" type="date" value="${escapeHtml(item?.expires || "")}"></label><label><input name="active" type="checkbox" ${item?.active ? "checked" : ""}> Activo</label>`;
  }
  $("#editor").showModal();
}
function saveEditor(event) {
  event.preventDefault();
  const values = new FormData(event.target);
  if (editing.type === "product") {
    const name = String(values.get("name")).trim();
    const id = editing.id || uniqueId(slug(name), store.products.map(p => p.id));
    const next = { id, name, description: String(values.get("description") || "").trim(), price: Number(values.get("price")), category: String(values.get("category")), image: String(values.get("image") || "").trim(), available: values.has("available"), featured: values.has("featured"), order: Number(values.get("order")) };
    if (editing.id) store.products[store.products.findIndex(p => p.id === editing.id)] = next;
    else store.products.push(next);
  } else if (editing.type === "category") {
    const name = String(values.get("name")).trim();
    const id = editing.id || uniqueId(slug(name), store.categories.map(c => c.id));
    const next = { id, name, emoji: String(values.get("emoji") || ""), active: values.has("active"), order: Number(values.get("order")) };
    if (editing.id) store.categories[store.categories.findIndex(c => c.id === editing.id)] = next;
    else store.categories.push(next);
  } else {
    const code = String(values.get("code")).trim().toUpperCase();
    if (store.coupons.some(c => c.code === code && c.code !== editing.id)) { status("Ya existe un cupón con ese código."); return; }
    const type = String(values.get("type"));
    const value = Number(values.get("value"));
    if (type === "percent" && value > 100) { status("El porcentaje no puede superar 100."); return; }
    const next = { code, type, value, expires: String(values.get("expires") || ""), active: values.has("active") };
    if (editing.id) store.coupons[store.coupons.findIndex(c => c.code === editing.id)] = next;
    else store.coupons.push(next);
  }
  $("#editor").close(); save();
}
function uniqueId(base, ids) { let id = base || "nuevo"; let suffix = 2; while (ids.includes(id)) id = `${base}-${suffix++}`; return id; }
function remove(type, id) {
  if (!confirm("¿Eliminar este elemento del borrador?")) return;
  if (type === "product") store.products = store.products.filter(p => p.id !== id);
  if (type === "category") {
    if (store.products.some(p => p.category === id)) { status("Primero cambia de categoría los productos asociados."); return; }
    store.categories = store.categories.filter(c => c.id !== id);
  }
  if (type === "coupon") store.coupons = store.coupons.filter(c => c.code !== id);
  save();
}
document.addEventListener("click", event => {
  const button = event.target.closest("button"); if (!button) return;
  if (button.dataset.tab) { document.querySelectorAll(".tabs button").forEach(tab => { if (tab === button) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current"); }); document.querySelectorAll(".panel").forEach(panel => panel.hidden = panel.id !== `${button.dataset.tab}-panel`); }
  if (button.dataset.edit) openEditor(button.dataset.edit, button.dataset.id);
  if (button.dataset.delete) remove(button.dataset.delete, button.dataset.id);
  if (button.id === "new-product") openEditor("product");
  if (button.id === "new-category") openEditor("category");
  if (button.id === "new-coupon") openEditor("coupon");
  if (button.id === "close-editor" || button.id === "cancel-editor") $("#editor").close();
  if (button.id === "download") { const blob = new Blob([JSON.stringify(store, null, 2) + "\n"], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "store.json"; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 5000); status("Descarga lista. Reemplaza data/store.json en GitHub para publicar los cambios."); }
});
$("#editor-form").addEventListener("submit", saveEditor);
$("#config-form").addEventListener("submit", event => { event.preventDefault(); const values = new FormData(event.target); for (const key of Object.keys(store.config)) if (values.has(key)) store.config[key] = String(values.get(key)).trim(); save(); });
start();
