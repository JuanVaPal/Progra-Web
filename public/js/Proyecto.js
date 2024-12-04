/* Carrusel */
var miCarrusel = document.querySelector('#carouselExample');
var carrusel = new bootstrap.Carousel(miCarrusel, {
    interval: 2000,
    wrap: true
});

document.querySelector('.carousel-control-prev').addEventListener('click', function() {
    carrusel.prev();
});

document.querySelector('.carousel-control-next').addEventListener('click', function() {
    carrusel.next();
});

/* Formulario */
function abrirMenu() {
    document.getElementById("FormularioPU").style.display = "block";
    const pestaña1 = document.getElementById('tab1');
    const pestaña2 = document.getElementById('tab2');
    const contenido1 = document.getElementById('content1');
    const contenido2 = document.getElementById('content2');

    pestaña1.addEventListener('click', function() {
        contenido1.classList.add('active');
        contenido2.classList.remove('active');
        pestaña1.classList.add('active');
        pestaña2.classList.remove('active');
    });

    pestaña2.addEventListener('click', function() {
        contenido2.classList.add('active');
        contenido1.classList.remove('active');
        pestaña2.classList.add('active');
        pestaña1.classList.remove('active');
    });

    function cerrarMenu() {
        document.getElementById("FormularioPU").style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == document.getElementById("FormularioPU")) {
            cerrarMenu();
        }
    }
}

// Menú
function mostrarProductoMenu() {
    const productos = document.querySelectorAll('.prod');
    
    productos.forEach(function(prod) {
        prod.addEventListener('click', function() {

            const panel = prod.getAttribute('data-panel');
            const secciones = document.querySelectorAll('.carta > div');
            secciones.forEach(function(seccion) {
                seccion.style.display = 'none';
            });

            const panelActivo = document.querySelector(`.${panel}`);
            if (panelActivo) {
                panelActivo.style.display = 'block';
            }
        });
    });
}
mostrarProductoMenu();

//Boton de Tabla de Horarios
function abrirPU() {
    document.getElementById('modal').classList.add('is-active');
}

function cerrarPU() {
    document.getElementById('modal').classList.remove('is-active');
}

//Formulario de Reservación
function enviar() {
    if (validarFormulario()==true){
        document.getElementById("mensajeConfirmacion").style.display = "block";
        event.preventDefault();
        document.getElementById("formulario1").reset();
    }
    
}

 //Validacion
 function validarFormulario(event) {
    event.preventDefault(); 

    const nombre = document.getElementById('nombre1').value.trim(); // ID corregido
    const telefono = document.getElementById('numero').value.trim(); // ID corregido
    const numeroMesa = document.getElementById('numeroMesa').value.trim();
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion');

    if (!nombre || !telefono || !numeroMesa) {
        alert('Todos los campos deben ser contestados.');
        return false;
    }

    if (!/^\d+$/.test(telefono)) {
        alert('El número de teléfono debe contener solo números.');
        return false;
    }

    const mesa = parseInt(numeroMesa, 10);
    if (isNaN(mesa) || mesa < 0 || mesa > 19) {
        alert('El número de mesa debe estar entre 0 y 19.');
        return false;
    }

    mensajeConfirmacion.style.display = 'block';
    document.getElementById("formulario1").reset();
    return true;
}

function validarFormulario2(event) {
    event.preventDefault(); // Prevenir el envío del formulario por defecto

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const ordenar = document.querySelectorAll('input[name="ordenar[]"]:checked');
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion2');

    // Verificar si los datos están siendo capturados correctamente
    console.log('Nombre:', nombre);
    console.log('Teléfono:', telefono);
    console.log('Dirección:', direccion);
    console.log('Combos seleccionados:', ordenar.length);

    // Validar que los campos no estén vacíos
    if (!nombre || !telefono || !direccion) {
        alert('Todos los campos deben ser contestados.');
        return false;
    }

    // Validar que el teléfono sea solo números
    if (!/^\d+$/.test(telefono)) {
        alert('El número de teléfono debe contener solo números.');
        return false;
    }

    // Validar que al menos un combo esté seleccionado
    if (ordenar.length === 0) {
        alert('Por favor, selecciona al menos un combo.');
        return false;
    }

    // Mostrar mensaje de confirmación
    mensajeConfirmacion.style.display = 'block';

    // Verificar si el formulario se está enviando
    console.log("Formulario válido, enviando datos...");

    // Enviar el formulario
    document.getElementById("formulario2").submit();
    return true;
}

function validarLogin(event) {
    event.preventDefault(); 

    const usuario = document.getElementById('usuario').value.trim(); 
    const contraseña = document.getElementById('contrasena').value.trim(); 
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion3');

    if (!usuario || !contraseña) {
        alert('Todos los campos deben ser contestados.');
        return false;
    }

    mensajeConfirmacion.style.display = 'block';
    document.getElementById("formulario3").reset();
    
    return true;
}

function alertaYRedirigir() {
    alert("Es necesario iniciar sesión");
    window.location.href = "/login";
}

function obtenerPedidos() {
    const filtro = document.getElementById('filtro').value;
    const valorFiltro = document.getElementById('valorFiltro').value;

    // Construir la URL de acuerdo al filtro seleccionado
    let url = '/obtenerPedidos';

    if (filtro === 'fecha' && valorFiltro) {
        url += `?fecha=${encodeURIComponent(valorFiltro)}`;
    } else if (filtro === 'precio' && valorFiltro) {
        url += `?precio=${encodeURIComponent(valorFiltro)}`;
    } else if (filtro === 'combo' && valorFiltro) {
        url += `?combo=${encodeURIComponent(valorFiltro)}`;
    } else if (filtro === 'cancelados') {
        url += `?cancelados=true`;  // Agregar el filtro para pedidos cancelados
    }

    // Hacer la solicitud al servidor
    fetch(url)
        .then(response => response.json())
        .then(data => {
            mostrarPedidos(data);
        })
        .catch(error => {
            console.error('Error al obtener pedidos:', error);
            alert('Error al cargar los pedidos.');
        });
}

function mostrarPedidos(pedidos) {
    const tablaBody = document.querySelector('#tablaPedidos tbody');
    tablaBody.innerHTML = ''; // Limpiar el contenido previo

    // Mostrar mensaje si no hay pedidos
    if (pedidos.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No se encontraron pedidos.</td></tr>';
        return;
    }

    // Mostrar los pedidos en la tabla
    pedidos.forEach(pedido => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${pedido.id_pedido}</td>
            <td>${pedido.fecha_pedido}</td>
            <td>${pedido.direccion}</td>
            <td>${pedido.estado}</td>
            <td>${pedido.telefono}</td>
            <td>$${parseFloat(pedido.precio_total).toFixed(2)}</td>
            <td>${pedido.combos}</td>
            <td>
                <button class="botonEditar" onclick="editarPedido(${pedido.id_pedido}, '${pedido.direccion}', '${pedido.estado}', '${pedido.telefono}')">Editar</button>
                <button class="botonEliminar" onclick="cancelarPedido(${pedido.id_pedido})">Cancelar</button>
            </td>
        `;
        tablaBody.appendChild(fila);
    });
}


/*function eliminarPedido(id_pedido) {
    fetch(`/eliminarPedido/${id_pedido}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            obtenerPedidos();
        })
        .catch(error => {
            console.error('Error al eliminar pedido:', error);
            alert('Error al eliminar el pedido.');
        });
} */

function cancelarPedido(id_pedido) {
    fetch(`/cancelarPedido/${id_pedido}`, { method: 'POST' }) // Cambiado a POST
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            obtenerPedidos(); // Refresca los pedidos en la tabla
        })
        .catch(error => {
            console.error('Error al cancelar pedido:', error);
            alert('Error al cancelar el pedido.');
        });
}

function editarPedido(id_pedido, direccion, telefono) {
    const nuevaDireccion = prompt('Nueva Dirección:', direccion);
    const nuevoTelefono = prompt('Nuevo Teléfono:', telefono);

    fetch(`/actualizarPedido/${id_pedido}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion: nuevaDireccion, telefono: nuevoTelefono })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            obtenerPedidos();
        })
        .catch(error => {
            console.error('Error al actualizar pedido:', error);
            alert('Error al actualizar el pedido.');
        });
}
//Hay más de codigo de JS en la línea 792 del Proyecto.html

/* Modificaciones Finaes  */
let totalPrice = 0; // Asegúrate de que esté al nivel global

function toggleCombo(comboId, price) {
    const combo = document.getElementById(comboId);
    const cantidadInput = document.querySelector(`#${comboId} .cantidad-wrapper input`);
    
    if (!combo || !cantidadInput) {
        console.error("Elemento no encontrado:", comboId, cantidadInput);
        return;
    }

    if (combo.classList.contains('selected')) {
        combo.classList.remove('selected');
        totalPrice -= cantidadInput.value * price;
        cantidadInput.value = 0; // Resetea la cantidad
    } else {
        combo.classList.add('selected');
    }
    updateTotalPrice();
}

function adjustCantidad(cantidadId, comboId, price, increment) {
    const cantidadInput = document.getElementById(cantidadId);
    const combo = document.getElementById(comboId);

    if (!cantidadInput || !combo) {
        console.error("Elemento no encontrado:", cantidadId, comboId);
        return;
    }

    if (!combo.classList.contains('selected')) {
        combo.classList.add('selected'); // Selecciona automáticamente si no está seleccionado
    }

    let currentValue = parseInt(cantidadInput.value, 10) || 0; // Maneja valores no válidos
    currentValue += increment;
    if (currentValue < 0) currentValue = 0; // No permite valores negativos
    cantidadInput.value = currentValue;

    if (increment > 0 || currentValue > 0) { // Previene descuentos negativos en totalPrice
        totalPrice += increment * price;
    }

    updateTotalPrice();
}

function updateTotalPrice() {
    const totalPriceElement = document.getElementById('precio-total');
    if (!totalPriceElement) {
        console.error("Elemento 'precio-total' no encontrado.");
        return;
    }
    totalPriceElement.innerText = totalPrice.toFixed(2);
}

// Asegura la carga del DOM antes de usar el script
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script inicializado.");
});


