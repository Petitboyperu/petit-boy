(() => {
  const form = document.querySelector("#custom-order-form");
  const dateInput = form.elements.eventDate;
  const typeInput = form.elements.orderType;
  const baseInput = form.elements.base;
  const fillingInput = form.elements.filling;
  const nameInput = form.elements.customerName;
  const status = document.querySelector("#custom-order-status");
  const whatsappLink = document.querySelector("#custom-order-whatsapp-link");
  let config = null;
  let leadDays = 3;

  function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function minimumDate() {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + leadDays);
    return localDateString(date);
  }

  function updateMinimumDate() {
    dateInput.min = minimumDate();
    document.querySelector("#custom-order-date-help").textContent = `Elige una fecha desde el ${formatDate(dateInput.min)}.`;
  }

  function formatDate(value) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function validateDate() {
    dateInput.setCustomValidity(dateInput.value && dateInput.value < dateInput.min
      ? `Elige una fecha desde el ${formatDate(dateInput.min)}.`
      : "");
  }

  function updateCakeFields() {
    const isCake = typeInput.value === "Torta temática";
    baseInput.required = isCake;
    fillingInput.required = isCake;
    for (const id of ["custom-order-base-label", "custom-order-filling-label"]) {
      document.querySelector(`#${id} .custom-orders-optional`).textContent = isCake
        ? "(elige una opción)"
        : "(opcional según pedido)";
    }
  }

  function quoteMessage(values) {
    const base = values.get("base") || "Por definir";
    const filling = values.get("filling") || "Por definir";
    const notes = String(values.get("notes") || "").trim();
    return [
      "*SOLICITUD DE COTIZACIÓN · PETIT BOY*",
      "Hola, quisiera cotizar un pedido personalizado para mi evento.",
      "",
      "*PEDIDO*",
      `Tipo: ${values.get("orderType")}`,
      `Bizcocho o base: ${base}`,
      `Relleno o combinación: ${filling}`,
      `Porciones o invitados: ${values.get("size")}`,
      "",
      "*EVENTO*",
      `Fecha: ${formatDate(values.get("eventDate"))}`,
      `Ocasión: ${values.get("occasion")}`,
      `Temática, colores o dedicatoria: ${notes || "Por definir"}`,
      "",
      "*CONTACTO*",
      `Nombre: ${String(values.get("customerName")).trim()}`,
      "",
      "Entiendo que el precio, los sabores y la disponibilidad se confirmarán por WhatsApp."
    ].join("\n");
  }

  document.addEventListener("petitboy:store-ready", event => {
    config = event.detail;
    const configuredDays = Number(config.customOrderLeadDays);
    if (Number.isInteger(configuredDays) && configuredDays > 0 && configuredDays <= 60) leadDays = configuredDays;
    const extra = leadDays < 5 ? " Para diseños más elaborados, recomendamos 5 días o más." : "";
    document.querySelector("#custom-order-lead-text").textContent =
      `Todos los pedidos personalizados requieren al menos ${leadDays} días de anticipación para cuidar cada detalle artesanal.${extra}`;
    updateMinimumDate();
    validateDate();
  });

  typeInput.addEventListener("change", updateCakeFields);
  dateInput.addEventListener("input", validateDate);
  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

  form.addEventListener("submit", event => {
    event.preventDefault();
    status.textContent = "";
    updateMinimumDate();
    validateDate();
    nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Escribe tu nombre para continuar.");
    if (!form.reportValidity()) return;

    const number = String(config?.whatsappNumber || "").replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(number)) {
      status.textContent = "No pudimos preparar WhatsApp. Inténtalo de nuevo en unos momentos.";
      return;
    }

    const message = quoteMessage(new FormData(form));
    whatsappLink.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    whatsappLink.click();
    status.textContent = "Tu solicitud está lista para enviarse por WhatsApp.";
  });

  updateCakeFields();
  updateMinimumDate();
})();
