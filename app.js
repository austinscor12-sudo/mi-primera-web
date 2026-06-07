// 1. Importamos las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
 
// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9JMfG6mEWMdF_IMSRShi1i7mO4g17t_c",
  authDomain: "mitiendaweb-cfbfc.firebaseapp.com",
  projectId: "mitiendaweb-cfbfc",
  storageBucket: "mitiendaweb-cfbfc.firebasestorage.app",
  messagingSenderId: "303540347664",
  appId: "1:303540347664:web:327fe3979f3b9088747b95",
  measurementId: "G-3S6B8N30NH"
};
 
// 2. Inicializamos los servicios
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app); 
const provider = new GoogleAuthProvider(); 
 
const EMAIL_ADMIN = "austinscor12@gmail.com"; 
 
// Array global para controlar el carrito de compras
let carrito = [];
 
// 3. FUNCIÓN PARA INICIAR SESIÓN CON GOOGLE
async function iniciarSesion() {
  try {
    const result = await signInWithPopup(auth, provider);
    const usuario = result.user;
    console.log("Usuario ingresado: ", usuario.displayName);
    alert("¡Hola " + usuario.displayName + "!");
  } catch (error) {
    console.error("Error al iniciar sesión: ", error);
  }
}
 
// 4. FUNCIÓN PARA CERRAR SESIÓN
async function cerrarSesion() {
  try {
    await signOut(auth);
    alert("Sesión cerrada.");
    window.location.reload(); 
  } catch (error) {
    console.error("Error al cerrar sesión: ", error);
  }
}
 
// 5. CONTROLADOR DE AUTENTICACIÓN (Vigila el estado del usuario)
onAuthStateChanged(auth, (user) => {
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");
  const panelAdmin = document.getElementById("panel-admin");
  const btnIrAdmin = document.getElementById("btn-ir-admin");
  
  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";
    
    if (user.email === EMAIL_ADMIN) {
      console.log("¡Bienvenido Administrador!");
      if (btnIrAdmin) btnIrAdmin.style.display = "inline-block";
      if (panelAdmin) panelAdmin.style.display = "block";
      cargarProductosAdmin(); 
    } else {
      if (btnIrAdmin) btnIrAdmin.style.display = "none";
      if (panelAdmin) panelAdmin.style.display = "none";
    }
  } else {
    if (btnLogin) btnLogin.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (btnIrAdmin) btnIrAdmin.style.display = "none";
    if (panelAdmin) panelAdmin.style.display = "none";
  }
});
 
// 6. RENDERIZAR CATÁLOGO PÚBLICO
async function cargarCatalogoPublico() {
  const remerasGrid = document.querySelector('.remeras-grid');
  if (!remerasGrid) return;
 
  try {
    const querySnapshot = await getDocs(collection(db, "remeras"));
 
    // ✅ FIX: siempre limpiamos la grilla antes de renderizar
    remerasGrid.innerHTML = "";
 
    if (querySnapshot.empty) {
      remerasGrid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">No hay remeras cargadas aún.</p>';
      return;
    }
 
    querySnapshot.forEach((docSnap) => {
      const prod = docSnap.data();
      const id = docSnap.id;
 
      const imgFrente = prod.imgFrente || "https://via.placeholder.com/300x350?text=Frente";
      const imgDorso = prod.imgDorso || "https://via.placeholder.com/300x350?text=Dorso";
 
      const card = document.createElement('div');
      card.className = "remera-card reveal";
      card.style.cssText = "max-width:600px; background: rgba(20, 20, 30, 0.6); border: 1px solid #222; padding: 15px; border-radius: 8px;";
      
      card.innerHTML = `
        <span class="available-tag">✅ Stock ${prod.talle}</span>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          <div style="position:relative;">
            <span style="position:absolute;top:.5rem;left:.5rem;background:rgba(0,0,0,.6);color:#fff;font-size:.65rem;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;padding:.2rem .5rem;border-radius:.3rem;z-index:2;">FRENTE</span>
            <img class="remera-img" src="${imgFrente}" style="width:100%; border-radius:4px; height: 250px; object-fit: cover;">
          </div>
          <div style="position:relative;">
            <span style="position:absolute;top:.5rem;left:.5rem;background:rgba(0,0,0,.6);color:#fff;font-size:.65rem;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;padding:.2rem .5rem;border-radius:.3rem;z-index:2;">DORSO</span>
            <img class="remera-img" src="${imgDorso}" style="width:100%; border-radius:4px; height: 250px; object-fit: cover;">
          </div>
        </div>
 
        <div style="margin-top: 15px; font-family: 'Rajdhani', sans-serif;">
          <h3 style="color: #fff; margin: 0 0 5px 0; text-transform: uppercase; font-size: 1.3rem;">${prod.nombre}</h3>
          <p style="color: var(--cyan); font-weight: 700; font-size: 1.4rem; margin: 0 0 15px 0;">$${prod.precio}</p>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="https://wa.me/5493794123456?text=Hola!%20Me%20interesa%20la%20remera%20${encodeURIComponent(prod.nombre)}%20en%20talle%20${prod.talle}" target="_blank" class="btn-wa" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: white; padding: 10px; text-decoration: none; border-radius: 4px; font-weight: bold; cursor: pointer !important; font-size: 0.9rem; text-transform: uppercase;">
              💬 Consultar WhatsApp
            </a>
 
            <button class="btn-agregar-carrito" 
                    data-id="${id}" 
                    data-nombre="${prod.nombre}" 
                    data-precio="${prod.precio}" 
                    style="display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--magenta, #ff0055); color: white; padding: 11px; border: none; border-radius: 4px; font-weight: bold; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 1px; cursor: pointer !important; font-size: 0.9rem;">
              🛒 Añadir al Carrito
            </button>
          </div>
        </div>
      `;
 
      // ✅ FIX: forzar visibilidad de las cards nuevas
      remerasGrid.appendChild(card);
      setTimeout(() => card.classList.add('visible'), 50);
    });
 
  } catch (error) {
    console.error("Error al cargar catálogo público:", error);
  }
}
 
// 7. LÓGICA DEL PANEL DE ADMINISTRACIÓN (CRUD)
const adminForm = document.getElementById('admin-form');
if (adminForm) {
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idProducto = document.getElementById('admin-id').value;
    const nombre = document.getElementById('admin-nombre').value;
    const precio = parseFloat(document.getElementById('admin-precio').value);
    const talle = document.getElementById('admin-talle').value;
    const imgFrente = document.getElementById('admin-img-frente').value; 
    const imgDorso = document.getElementById('admin-img-dorso').value;
 
    const productoData = { nombre, precio, talle, imgFrente, imgDorso };
 
    try {
      if (idProducto === "") {
        await addDoc(collection(db, "remeras"), productoData);
        alert("Remera añadida con éxito.");
      } else {
        await updateDoc(doc(db, "remeras", idProducto), productoData);
        alert("Remera actualizada con éxito.");
        document.getElementById('btn-cancelar-edicion').style.display = 'none';
      }
      adminForm.reset();
      document.getElementById('admin-id').value = "";
      cargarProductosAdmin();
      cargarCatalogoPublico();
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  });
}
 
async function cargarProductosAdmin() {
  const listaAdmin = document.getElementById('lista-productos-admin');
  if (!listaAdmin) return;
  
  listaAdmin.innerHTML = "<tr><td colspan='4'>Cargando remeras...</td></tr>";
  
  try {
    const querySnapshot = await getDocs(collection(db, "remeras"));
    listaAdmin.innerHTML = "";
    
    querySnapshot.forEach((docSnap) => {
      const prod = docSnap.data();
      const id = docSnap.id;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px;"><strong>${prod.nombre}</strong></td>
        <td style="padding:8px;">$${prod.precio}</td>
        <td style="padding:8px;">${prod.talle}</td>
        <td style="padding:8px;">
          <button class="btn-edit" data-id="${id}" data-frente="${prod.imgFrente || ''}" data-dorso="${prod.imgDorso || ''}" style="background:#00e5ff; color:#000; border:none; padding:4px 8px; cursor:pointer; font-weight:bold; margin-right:5px;">Editar</button>
          <button class="btn-delete" data-id="${id}" style="background:#e8005a; color:#fff; border:none; padding:4px 8px; cursor:pointer; font-weight:bold;">Borrar</button>
        </td>
      `;
      listaAdmin.appendChild(tr);
    });
 
    // Eventos Borrar
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async (e) => {
        if(confirm("¿Seguro que querés eliminar esta remera?")) {
          const id = e.target.getAttribute('data-id');
          await deleteDoc(doc(db, "remeras", id));
          cargarProductosAdmin();
          cargarCatalogoPublico();
        }
      };
    });
 
    // Eventos Editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.getAttribute('data-id');
        const frente = e.target.getAttribute('data-frente');
        const dorso = e.target.getAttribute('data-dorso');
        const fila = e.target.closest('tr');
        
        document.getElementById('admin-id').value = id;
        document.getElementById('admin-nombre').value = fila.cells[0].innerText;
        document.getElementById('admin-precio').value = fila.cells[1].innerText.replace('$','');
        document.getElementById('admin-talle').value = fila.cells[2].innerText;
        document.getElementById('admin-img-frente').value = frente;
        document.getElementById('admin-img-dorso').value = dorso;
        
        document.getElementById('btn-cancelar-edicion').style.display = 'inline-block';
      };
    });
  } catch (error) {
    console.error("Error en tabla admin:", error);
  }
}
 
// 8. ESCUCHADOR DE EVENTOS PARA EL CARRITO
document.addEventListener('click', (e) => {
  const botonAgregar = e.target.closest('.btn-agregar-carrito');
  if (botonAgregar) {
    const id = botonAgregar.getAttribute('data-id');
    const nombre = botonAgregar.getAttribute('data-nombre');
    const precio = parseFloat(botonAgregar.getAttribute('data-precio'));
 
    const producto = { id, nombre, precio, cantidad: 1 };
 
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      existe.cantidad++;
    } else {
      carrito.push(producto);
    }
 
    actualizarCarritoHTML();
    
    const carritoContenedor = document.getElementById("carrito-contenedor");
    if (carritoContenedor) carritoContenedor.style.right = "0px";
  }
});
 
function actualizarCarritoHTML() {
  const carritoItems = document.getElementById('carrito-items');
  const carritoTotal = document.getElementById('carrito-total');
  
  if (!carritoItems || !carritoTotal) return;
 
  if (carrito.length === 0) {
    carritoItems.innerHTML = '<p id="carrito-vacio" style="color: #666; text-align: center; margin-top: 50px;">El carrito está vacío.</p>';
    carritoTotal.innerText = '$0';
    return;
  }
 
  carritoItems.innerHTML = "";
  let total = 0;
 
  carrito.forEach(item => {
    total += item.precio * item.cantidad;
    const div = document.createElement('div');
    div.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#1a1a2e; padding:10px; border-radius:4px;";
    div.innerHTML = `
      <div>
        <h4 style="margin:0; font-size:1rem;">${item.nombre}</h4>
        <span style="color:var(--cyan); font-size:0.9rem;">$${item.precio} x ${item.cantidad}</span>
      </div>
      <button class="btn-quitar" data-id="${item.id}" style="background:none; border:none; color:#ff0055; font-weight:bold; cursor:pointer;">✕</button>
    `;
    carritoItems.appendChild(div);
  });
 
  carritoTotal.innerText = `$${total}`;
 
  document.querySelectorAll('.btn-quitar').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.getAttribute('data-id');
      carrito = carrito.filter(item => item.id !== id);
      actualizarCarritoHTML();
    };
  });
}
 
// 9. INICIALIZACIÓN DE BOTONES DE INTERFAZ
function conectarBotones() {
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogin) btnLogin.onclick = iniciarSesion;
  if (btnLogout) btnLogout.onclick = cerrarSesion;
 
  const btnAbrirCarrito = document.getElementById("btn-abrir-carrito");
  const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
  const carritoContenedor = document.getElementById("carrito-contenedor");
 
  if (btnAbrirCarrito && carritoContenedor) {
    btnAbrirCarrito.onclick = () => { carritoContenedor.style.right = "0px"; };
  }
  if (btnCerrarCarrito && carritoContenedor) {
    btnCerrarCarrito.onclick = () => { carritoContenedor.style.right = "-400px"; };
  }
  
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
  if (btnCancelarEdicion) {
    btnCancelarEdicion.onclick = () => {
      if (adminForm) adminForm.reset();
      document.getElementById('admin-id').value = "";
      btnCancelarEdicion.style.display = 'none';
    };
  }
 
  // Botón cerrar panel admin
  const btnCerrarAdmin = document.getElementById("btn-cerrar-admin");
  if (btnCerrarAdmin) btnCerrarAdmin.onclick = () => { 
    document.getElementById("panel-admin").style.display = "none"; 
  };
 
  // Botón "Panel Admin" de la nav
  const btnIrAdmin = document.getElementById("btn-ir-admin");
  if (btnIrAdmin) btnIrAdmin.onclick = () => { 
    document.getElementById("panel-admin").style.display = "block"; 
  };
}
 
// Arranca la carga de datos al abrir la página
conectarBotones();
cargarCatalogoPublico();
 
export { app, db, auth, iniciarSesion, cerrarSesion };
