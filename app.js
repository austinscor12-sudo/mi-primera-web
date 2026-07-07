import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9JMfG6mEWMdF_IMSRShi1i7mO4g17t_c",
  authDomain: "mitiendaweb-cfbfc.firebaseapp.com",
  projectId: "mitiendaweb-cfbfc",
  storageBucket: "mitiendaweb-cfbfc.firebasestorage.app",
  messagingSenderId: "303540347664",
  appId: "1:303540347664:web:327fe3979f3b9088747b95",
  measurementId: "G-3S6B8N30NH"
};

const ADMIN_EMAIL = "austinscor12@gmail.com";
const WHATSAPP_NUMBER = "543794042792";
const COLLECTION_REMERAS = "remeras";
const CART_KEY = "estampaStudioCartV2";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

isSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

let carrito = loadCart();
let adminProducts = new Map();
let currentUser = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  navMenu: $("#nav-menu"),
  menuToggle: $("#menu-toggle"),
  overlay: $("#overlay"),
  btnLogin: $("#btn-login"),
  btnLogout: $("#btn-logout"),
  btnIrAdmin: $("#btn-ir-admin"),
  panelAdmin: $("#panel-admin"),
  btnCerrarAdmin: $("#btn-cerrar-admin"),
  adminForm: $("#admin-form"),
  adminId: $("#admin-id"),
  adminNombre: $("#admin-nombre"),
  adminPrecio: $("#admin-precio"),
  adminTalle: $("#admin-talle"),
  adminImgFrente: $("#admin-img-frente"),
  adminImgDorso: $("#admin-img-dorso"),
  btnCancelarEdicion: $("#btn-cancelar-edicion"),
  listaAdmin: $("#lista-productos-admin"),
  remerasGrid: $("#remeras-grid"),
  carritoContenedor: $("#carrito-contenedor"),
  btnAbrirCarrito: $("#btn-abrir-carrito"),
  btnCerrarCarrito: $("#btn-cerrar-carrito"),
  carritoItems: $("#carrito-items"),
  carritoTotal: $("#carrito-total"),
  cartCount: $("#cart-count"),
  btnComprar: $("#btn-comprar"),
  introOverlay: $("#intro-overlay")
};

function formatARS(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(number).replace("ARS", "$").trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value, fallbackText) {
  const url = String(value || "").trim();
  if (/^https?:\/\//i.test(url)) return url;
  return `https://placehold.co/600x750/10131b/f6f7fb?text=${encodeURIComponent(fallbackText)}`;
}

function encodeMessage(text) {
  return encodeURIComponent(text);
}

function openWhatsApp(message) {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeMessage(message)}`, "_blank", "noopener");
}

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

function cartTotal() {
  return carrito.reduce((total, item) => total + (Number(item.precio) || 0) * (Number(item.cantidad) || 1), 0);
}

function cartQuantity() {
  return carrito.reduce((total, item) => total + (Number(item.cantidad) || 1), 0);
}

function updateCartUI() {
  if (!els.carritoItems || !els.carritoTotal || !els.cartCount) return;

  els.cartCount.textContent = cartQuantity();
  els.carritoTotal.textContent = formatARS(cartTotal());

  if (carrito.length === 0) {
    els.carritoItems.innerHTML = `<p class="cart-empty">El carrito está vacío.</p>`;
    return;
  }

  els.carritoItems.innerHTML = carrito.map((item) => `
    <div class="cart-line">
      <div>
        <h4>${escapeHtml(item.nombre)}</h4>
        <span>${formatARS(item.precio)} × ${item.cantidad}</span>
      </div>
      <button class="btn-quitar" type="button" data-id="${escapeHtml(item.id)}" aria-label="Quitar ${escapeHtml(item.nombre)}">✕</button>
    </div>
  `).join("");
}

function addToCart(producto) {
  const existing = carrito.find((item) => item.id === producto.id);
  if (existing) {
    existing.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  saveCart();
  updateCartUI();
  openCart();
}

function removeFromCart(id) {
  carrito = carrito.filter((item) => item.id !== id);
  saveCart();
  updateCartUI();
}

function checkout() {
  if (carrito.length === 0) {
    openWhatsApp("Hola Estampa Studio! Quiero hacer una consulta por un pedido personalizado.");
    return;
  }

  const lines = carrito.map((item) => `• ${item.nombre} x${item.cantidad} - ${formatARS(item.precio * item.cantidad)}`).join("\n");
  const message = `Hola Estampa Studio! Quiero consultar por este pedido:\n\n${lines}\n\nTotal aproximado: ${formatARS(cartTotal())}\n\n¿Está disponible?`;
  openWhatsApp(message);
}

function openCart() {
  els.carritoContenedor?.classList.add("open");
  els.overlay?.classList.add("show");
}

function closeCart() {
  els.carritoContenedor?.classList.remove("open");
  els.overlay?.classList.remove("show");
}

function closeMenu() {
  els.navMenu?.classList.remove("open");
  document.body.classList.remove("menu-open");
}

function toggleMenu() {
  els.navMenu?.classList.toggle("open");
  document.body.classList.toggle("menu-open", els.navMenu?.classList.contains("open"));
}

function openAdminPanel() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Tenés que iniciar sesión como administrador.");
    return;
  }
  els.panelAdmin?.classList.add("open");
  cargarProductosAdmin();
}

function closeAdminPanel() {
  els.panelAdmin?.classList.remove("open");
}

async function iniciarSesion() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("No se pudo iniciar sesión. Revisá la consola para ver el error.");
  }
}

async function cerrarSesion() {
  try {
    await signOut(auth);
    closeAdminPanel();
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const isLogged = Boolean(user);
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (els.btnLogin) els.btnLogin.style.display = isLogged ? "none" : "block";
  if (els.btnLogout) els.btnLogout.style.display = isLogged ? "block" : "none";
  if (els.btnIrAdmin) els.btnIrAdmin.style.display = isAdmin ? "block" : "none";

  if (isAdmin) {
    cargarProductosAdmin();
  } else {
    closeAdminPanel();
  }
});

async function cargarCatalogoPublico() {
  if (!els.remerasGrid) return;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_REMERAS));

    if (querySnapshot.empty) {
      els.remerasGrid.innerHTML = `
        <div class="stock-empty">
          Todavía no hay remeras cargadas. Entrá al panel admin para agregar las primeras prendas disponibles.
        </div>
      `;
      return;
    }

    const products = [];
    querySnapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });

    products.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

    els.remerasGrid.innerHTML = products.map((prod) => {
      const nombre = escapeHtml(prod.nombre || "Remera personalizada");
      const talle = escapeHtml(prod.talle || "Consultar talle");
      const precio = Number(prod.precio) || 0;
      const imgFrente = safeUrl(prod.imgFrente, "Frente");
      const imgDorso = safeUrl(prod.imgDorso, "Dorso");

      return `
        <article class="remera-card reveal visible tilt-3d">
          <div class="remera-images">
            <span class="image-label front">FRENTE</span>
            <span class="image-label back">DORSO</span>
            <img src="${imgFrente}" alt="Frente de ${nombre}" loading="lazy">
            <img src="${imgDorso}" alt="Dorso de ${nombre}" loading="lazy">
          </div>
          <div class="remera-body">
            <div class="remera-meta">
              <span class="size-pill">Stock: ${talle}</span>
            </div>
            <h3>${nombre}</h3>
            <div class="remera-price">${formatARS(precio)}</div>
            <div class="remera-actions">
              <button class="btn btn-primary btn-small btn-agregar-carrito" type="button" data-id="${escapeHtml(prod.id)}" data-nombre="${nombre}" data-precio="${precio}">🛒 Agregar al carrito</button>
              <a class="btn btn-secondary btn-small" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeMessage(`Hola! Me interesa la remera ${prod.nombre || "personalizada"} en talle/stock ${prod.talle || "a consultar"}. ¿Está disponible?`)}" target="_blank" rel="noopener">💬 Consultar</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error("Error al cargar catálogo público:", error);
    els.remerasGrid.innerHTML = `
      <div class="stock-empty">
        No se pudieron cargar las remeras. Revisá la configuración de Firebase o las reglas de Firestore.
      </div>
    `;
  }
}

async function cargarProductosAdmin() {
  if (!els.listaAdmin) return;

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    els.listaAdmin.innerHTML = `<tr><td colspan="4">Iniciá sesión como administrador para ver y editar remeras.</td></tr>`;
    return;
  }

  els.listaAdmin.innerHTML = `<tr><td colspan="4">Cargando remeras...</td></tr>`;
  adminProducts.clear();

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_REMERAS));

    if (querySnapshot.empty) {
      els.listaAdmin.innerHTML = `<tr><td colspan="4">Todavía no cargaste remeras.</td></tr>`;
      return;
    }

    const rows = [];
    querySnapshot.forEach((docSnap) => {
      const prod = { id: docSnap.id, ...docSnap.data() };
      adminProducts.set(prod.id, prod);
      rows.push(prod);
    });

    rows.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

    els.listaAdmin.innerHTML = rows.map((prod) => `
      <tr>
        <td><strong>${escapeHtml(prod.nombre || "Sin nombre")}</strong></td>
        <td>${formatARS(prod.precio)}</td>
        <td>${escapeHtml(prod.talle || "-")}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-small btn-edit" type="button" data-id="${escapeHtml(prod.id)}">Editar</button>
            <button class="btn btn-dark btn-small btn-delete" type="button" data-id="${escapeHtml(prod.id)}">Borrar</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Error en tabla admin:", error);
    els.listaAdmin.innerHTML = `<tr><td colspan="4">Error al cargar productos. Revisá Firebase.</td></tr>`;
  }
}

function fillAdminForm(prod) {
  if (!prod) return;
  els.adminId.value = prod.id || "";
  els.adminNombre.value = prod.nombre || "";
  els.adminPrecio.value = Number(prod.precio) || "";
  els.adminTalle.value = prod.talle || "";
  els.adminImgFrente.value = prod.imgFrente || "";
  els.adminImgDorso.value = prod.imgDorso || "";
  if (els.btnCancelarEdicion) els.btnCancelarEdicion.style.display = "inline-flex";
  els.adminNombre?.focus();
}

function resetAdminForm() {
  els.adminForm?.reset();
  if (els.adminId) els.adminId.value = "";
  if (els.btnCancelarEdicion) els.btnCancelarEdicion.style.display = "none";
}

async function saveAdminProduct(event) {
  event.preventDefault();

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Solo el administrador puede guardar productos.");
    return;
  }

  const productoData = {
    nombre: els.adminNombre.value.trim(),
    precio: Number(els.adminPrecio.value) || 0,
    talle: els.adminTalle.value.trim(),
    imgFrente: els.adminImgFrente.value.trim(),
    imgDorso: els.adminImgDorso.value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    const idProducto = els.adminId.value;

    if (idProducto) {
      await updateDoc(doc(db, COLLECTION_REMERAS, idProducto), productoData);
      alert("Remera actualizada.");
    } else {
      await addDoc(collection(db, COLLECTION_REMERAS), {
        ...productoData,
        createdAt: serverTimestamp()
      });
      alert("Remera agregada.");
    }

    resetAdminForm();
    await cargarProductosAdmin();
    await cargarCatalogoPublico();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("No se pudo guardar. Revisá las reglas de Firestore y la consola.");
  }
}

async function deleteAdminProduct(id) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Solo el administrador puede borrar productos.");
    return;
  }

  const prod = adminProducts.get(id);
  const nombre = prod?.nombre || "esta remera";
  if (!confirm(`¿Seguro que querés eliminar ${nombre}?`)) return;

  try {
    await deleteDoc(doc(db, COLLECTION_REMERAS, id));
    await cargarProductosAdmin();
    await cargarCatalogoPublico();
  } catch (error) {
    console.error("Error al borrar producto:", error);
    alert("No se pudo borrar. Revisá Firebase.");
  }
}


function setupIntro() {
  if (!els.introOverlay) return;

  const hideIntro = () => {
    els.introOverlay.classList.add("hide");
    setTimeout(() => els.introOverlay?.remove(), 650);
  };

  const timer = setTimeout(hideIntro, 1750);
  els.introOverlay.addEventListener("click", () => {
    clearTimeout(timer);
    hideIntro();
  }, { once: true });
}

function setupUI() {
  els.menuToggle?.addEventListener("click", toggleMenu);
  $$("#nav-menu a, #nav-menu button").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.id !== "btn-login" && item.id !== "btn-ir-admin") closeMenu();
    });
  });

  els.btnLogin?.addEventListener("click", iniciarSesion);
  els.btnLogout?.addEventListener("click", cerrarSesion);
  els.btnIrAdmin?.addEventListener("click", openAdminPanel);
  els.btnCerrarAdmin?.addEventListener("click", closeAdminPanel);
  els.adminForm?.addEventListener("submit", saveAdminProduct);
  els.btnCancelarEdicion?.addEventListener("click", resetAdminForm);

  els.btnAbrirCarrito?.addEventListener("click", openCart);
  els.btnCerrarCarrito?.addEventListener("click", closeCart);
  els.overlay?.addEventListener("click", closeCart);
  els.btnComprar?.addEventListener("click", checkout);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeMenu();
      closeAdminPanel();
    }
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest(".btn-agregar-carrito");
    if (addButton) {
      addToCart({
        id: addButton.dataset.id,
        nombre: addButton.dataset.nombre,
        precio: Number(addButton.dataset.precio) || 0
      });
      return;
    }

    const removeButton = event.target.closest(".btn-quitar");
    if (removeButton) {
      removeFromCart(removeButton.dataset.id);
      return;
    }

    const editButton = event.target.closest(".btn-edit");
    if (editButton) {
      fillAdminForm(adminProducts.get(editButton.dataset.id));
      return;
    }

    const deleteButton = event.target.closest(".btn-delete");
    if (deleteButton) {
      deleteAdminProduct(deleteButton.dataset.id);
    }
  });

  $$(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      $$(".faq-item.open").forEach((openItem) => openItem.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  $$(".reveal").forEach((item) => revealObserver.observe(item));
}

setupIntro();
setupUI();
updateCartUI();
cargarCatalogoPublico();

export { app, db, auth, iniciarSesion, cerrarSesion };
