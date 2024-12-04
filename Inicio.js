import express from 'express'; // Cambiamos require por import
import mysql from 'mysql2';
import session from 'express-session';
import bodyParser from 'body-parser';
import {PORT} from './Config.js'
import {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT} from './Config.js'

const app = express();

app.use(express.static('public'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Creamos la conexion a la base de datos con el metodo createConnection
let conexion = mysql.createConnection({
    host: DB_HOST,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD}); 
//Vamos a usar el motor de plantillas ejs
app.set('view engine', 'ejs');

app.use(express.json()); //Para reconocer objetos con extension JSON
app.use(express.urlencoded({extended: false})); //Express codifica todo el contenido que viene de un formulario (paginas html)
//El extended es para pedir si analiza o no los datos

app.use(session({
    secret: '12345', // Reemplaza con una cadena única
    resave: false,
    saveUninitialized: true,
}));

//Usamos el metodo get para obtener del servidor, la pagina inicio y la asignamos a la ruta incial
app.get("/", function(req, res){ //Todo servidor tiene una peticion (req) y una respuesta (res)
    res.render("Proyecto"); //Respuesta del servidor: que renderice o muestre la pagina inicio
});

app.get("/menu", function(req, res){
    res.render("menu");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/usuario", function(req, res){
    res.render("usuario");
});

app.get("/registro", function(req, res){
    res.render("registro");
});

app.get("/reservaciones", function(req, res){
    res.render("reservaciones");
});

/*Verificamos el Inicio de Sesion*/
app.post('/login', (req, res) => {
    const sesion = req.body;
    let usuario = sesion.usuario;
    let contrasena = sesion.contrasena;

    let buscar = "SELECT * FROM usuarios WHERE nombre_usuario = ? AND contrasena = ?";
    conexion.query(buscar, [usuario, contrasena], function(error, row) {
        if (error) {
            console.error(error);
            return res.send('<script>alert("Error en el servidor"); window.location.href="/login";</script>');  // Envía respuesta en caso de error
        } 

        if (row.length > 0) {  // Usuario encontrado
            req.session.user_id = row[0].id_usuario;
            req.session.save(() => {
            console.log('ID de usuario guardado en la sesión:', req.session.user_id);
            return res.redirect('/usuario');  // Redirige solo una vez
        });
        } else {
            return res.send('<script>alert("La contraseña o usuario están mal"); window.location.href="/login";</script>');  // En caso de error
        }
    });
});

/*Proceso de Registro*/
app.post("/validar", function(req, res) {
    const datos = req.body;
    let nombre = datos.nombre;
    let apellidoP = datos.apellidoP;
    let apellidoM = datos.apellidoM;
    let dir = datos.dir;
    let correo = datos.correo;
    let fecha = datos.fecha;
    let usuario = datos.usuario;
    let contra = datos.contra;

    let buscar = "SELECT * FROM usuarios WHERE nombre_usuario = ?";
    conexion.query(buscar, [usuario], function(error, row) {
        if (error) {
            console.error(error);
            return res.send('<script>alert("Error en el servidor"); window.location.href="/registro";</script>');
        }

        if (row.length > 0) {
            return res.send('<script>alert("El usuario ya está registrado"); window.location.href="/registro";</script>');
        }

        // Realiza el registro si el usuario no existe
        let registrar = `INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, direccion, correo, nombre_usuario, contrasena) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;

        conexion.query(registrar, [nombre, apellidoP, apellidoM, dir, correo, usuario, contra], function(error) {
            if (error) {
                console.error(error);
                return res.send('<script>alert("Registro No exitoso"); window.location.href="/registro";</script>');
            } else {
                return res.send('<script>alert("Registro exitoso"); window.location.href="/usuario";</script>'); 
            }
        });
    });
});

app.post('/formPedido', (req, res) => {
    const { nombre2, telefono, direccion, ordenar } = req.body;
    const id_usuario = req.session.user_id;

    // Precios estáticos para los combos
    const preciosCombos = {
        1: 155, // Combo 1
        2: 130,  // Combo 2
        3: 100,  // Combo 3
        4: 265,
        5: 299,
        6: 145
    };

    if (!ordenar || ordenar.length === 0) {
        return res.send('<script>alert("Por favor, selecciona al menos un combo."); window.location.href="/formPedido";</script>');
    }

    const fecha_pedido = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Insertar el pedido en la tabla 'pedidos'
    const queryPedido = `INSERT INTO pedidos (id_usuario, direccion, estado, telefono, fecha_pedido) VALUES (?, ?, 'En proceso', ?, ?)`;
    conexion.query(queryPedido, [id_usuario, direccion, telefono, fecha_pedido], function (error, result) {
        if (error) {
            console.error('Error al insertar el pedido:', error);
            return res.send('<script>alert("Hubo un error al registrar el pedido."); window.location.href="/usuario";</script>');
        }

        const id_pedido = result.insertId;

        // Preparar los valores para insertar en 'pedido_combos'
        const valoresCombos = ordenar
            .map(combo => {
                const precio = preciosCombos[combo.id];  // Obtener el precio estático para el combo
                const cantidad = parseInt(combo.cantidad, 10);  // Convertir cantidad a número
                console.log(`Cantidad para combo ${combo.id}:`, cantidad);  // Verificar cantidad

                // Validar cantidad y precio
                if (isNaN(cantidad) || isNaN(precio) || cantidad <= 0) {
                    console.error(`Cantidad o precio inválido para el combo ${combo.id}`);
                    return null;  // Si hay un error en los valores, retornar null
                }

                return [
                    id_pedido,            // ID del pedido
                    combo.id,             // ID del combo
                    cantidad,             // Cantidad seleccionada
                    cantidad * precio     // Precio total (cantidad * precio unitario)
                ];
            })
            .filter(val => val !== null); // Filtrar valores nulos

        // Verificar si hay valores válidos para insertar
        if (valoresCombos.length === 0) {
            return res.send('<script>alert("Hubo un problema con las cantidades o los precios de los combos."); window.location.href="/formPedido";</script>');
        }

        console.log('Valores a insertar en pedido_combos:', valoresCombos);

        const queryCombo = `INSERT INTO pedido_combos (id_pedido, id_combo, cantidad, precio_unitario) VALUES ?`;
        conexion.query(queryCombo, [valoresCombos], function (error) {
            if (error) {
                console.error('Error al insertar los combos en el pedido:', error);
                return res.send('<script>alert("Hubo un error al asociar los combos al pedido."); window.location.href="/formPedido";</script>');
            }

            // Confirmación del pedido
            return res.send('<script>alert("Pedido realizado con éxito."); window.location.href="/usuario";</script>');
        });
    });
});

app.get('/obtenerPedidos', (req, res) => {
    const { fecha, precio, combo, cancelados } = req.query;
    const id_usuario = req.session.user_id; // Usuario autenticado

    if (!id_usuario) {
        return res.status(401).send('No autorizado. Por favor, inicia sesión.');
    }

    let query = `
        SELECT pedidos.id_pedido, 
               DATE_FORMAT(pedidos.fecha_pedido, '%Y-%m-%d') AS fecha_pedido, 
               pedidos.direccion, 
               pedidos.estado, 
               pedidos.telefono, 
               (SELECT pedido_combos.precio_unitario 
                FROM pedido_combos 
                WHERE pedido_combos.id_pedido = pedidos.id_pedido 
                LIMIT 1) AS precio_total, 
               GROUP_CONCAT(DISTINCT combos.numero_combo ORDER BY combos.numero_combo) AS combos
        FROM pedidos
        LEFT JOIN pedido_combos ON pedidos.id_pedido = pedido_combos.id_pedido
        LEFT JOIN combos ON pedido_combos.id_combo = combos.id_combo
        WHERE pedidos.id_usuario = ?
    `;

    let queryParams = [id_usuario];

    // Aplicar filtros dinámicos
    if (fecha) {
        query += " AND DATE(pedidos.fecha_pedido) = ?";
        queryParams.push(fecha);
    }

    query += `
        GROUP BY pedidos.id_pedido, pedidos.fecha_pedido, pedidos.direccion, 
                 pedidos.estado, pedidos.telefono
    `;

    if (precio) {
        query += " HAVING precio_total <= ?";
        queryParams.push(precio);
        query += " ORDER BY precio_total DESC"; // Ordenar por precio de mayor a menor
    } else if (combo) {
        query += " HAVING FIND_IN_SET(?, combos)";
        queryParams.push(combo);
        query += " ORDER BY pedidos.fecha_pedido DESC"; // Ordenar por fecha de manera descendente
    } else {
        query += " ORDER BY pedidos.fecha_pedido DESC";
    }

    // Si el filtro "cancelados" es true, agregar la consulta para la tabla cancelados
    if (cancelados === 'true') {
        query = `
            SELECT cancelados.id_pedido, 
                   DATE_FORMAT(cancelados.fecha_pedido, '%Y-%m-%d') AS fecha_pedido, 
                   cancelados.direccion, 
                   cancelados.estado, 
                   cancelados.telefono, 
                   cancelados.precio_total, 
                   cancelados.combos AS combos
            FROM cancelados
            WHERE cancelados.id_usuario = ?
        `;
        queryParams = [id_usuario]; // Resetear los parámetros para la tabla "cancelados"
        query += " ORDER BY cancelados.fecha_pedido DESC"; // Ordenar por fecha de manera descendente
    }

    conexion.query(query, queryParams, (error, results) => {
        if (error) {
            console.error('Error al consultar pedidos:', error);
            return res.status(500).send('Error en el servidor.');
        }
        res.json(results);
    });
});

app.post('/cancelarPedido/:id', (req, res) => {
    const id_pedido = req.params.id;

    // Obtener los datos del pedido, incluyendo los combos asociados
    const query = `
        SELECT 
            p.id_pedido, p.id_usuario, p.direccion, p.estado, p.fecha_pedido, p.telefono,
            GROUP_CONCAT(pc.id_combo) AS id_combo,  
            GROUP_CONCAT(c.numero_combo ORDER BY c.numero_combo) AS combos, -- Almacenar los números de combos correctamente
            SUM(pc.cantidad * pc.precio_unitario) AS precio_total
        FROM pedidos p
        JOIN pedido_combos pc ON p.id_pedido = pc.id_pedido
        LEFT JOIN combos c ON pc.id_combo = c.id_combo
        WHERE p.id_pedido = ?
        GROUP BY p.id_pedido;
    `;

    conexion.query(query, [id_pedido], (error, results) => {
        if (error) {
            console.error('Error al obtener datos del pedido:', error);
            return res.status(500).send({ message: 'Error al obtener datos del pedido.' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'Pedido no encontrado.' });
        }

        const pedido = results[0];

        // Insertar en la tabla cancelados con la lista de combos
        const cancelQuery = `
            INSERT INTO cancelados (id_pedido, id_usuario, direccion, estado, fecha_pedido, telefono, combos, precio_total) 
            VALUES (?, ?, ?, "cancelado", ?, ?, ?, ?);
        `;

        conexion.query(cancelQuery, [
            pedido.id_pedido, pedido.id_usuario, pedido.direccion, 
            pedido.fecha_pedido, pedido.telefono, pedido.combos, pedido.precio_total
        ], (insertError) => {
            if (insertError) {
                console.error('Error al mover a cancelados:', insertError);
                return res.status(500).send({ message: 'Error al mover el pedido a cancelados.' });
            }

            // Actualizar estado del pedido original
            conexion.query(
                'UPDATE pedidos SET estado = "cancelado" WHERE id_pedido = ?',
                [id_pedido],
                (updateError) => {
                    if (updateError) {
                        console.error('Error al actualizar estado del pedido:', updateError);
                        return res.status(500).send({ message: 'Error al actualizar el estado del pedido.' });
                    }
                    res.send({ message: 'Pedido cancelado y movido a la tabla de cancelados.' });
                }
            );
        });
    });
});

app.get('/obtenerPedidos/:id_usuario', (req, res) => {
    const id_usuario = req.params.id_usuario;

    // Consultar tanto pedidos activos como cancelados
    conexion.query(
        `SELECT 
            p.id_pedido, p.direccion, p.estado, p.fecha_pedido, p.telefono, 
            NULL AS numero_combos, NULL AS precio_total
         FROM pedidos p
         WHERE p.id_usuario = ?
         UNION ALL
         SELECT 
            c.id_pedido, c.direccion, c.estado, c.fecha_pedido, c.telefono, 
            c.numero_combos, c.precio_total
         FROM cancelados c
         WHERE c.id_usuario = ?`,
        [id_usuario, id_usuario],
        (error, results) => {
            if (error) {
                console.error('Error al obtener pedidos:', error);
                return res.status(500).send({ message: 'Error al obtener los pedidos.' });
            }
            res.send(results);
        }
    );
});

/*app.delete('/eliminarPedido/:id', (req, res) => {
    const id_pedido = req.params.id;

    conexion.query('DELETE FROM pedidos WHERE id_pedido = ?', [id_pedido], (error, results) => {
        if (error) {
            console.error('Error al eliminar pedido:', error);
            return res.status(500).send('Error al eliminar el pedido.');
        }
        res.send({ message: 'Pedido eliminado correctamente.' });
    });
});*/

app.put('/actualizarPedido/:id', (req, res) => {
    const id_pedido = req.params.id;
    const { direccion, telefono } = req.body;

    const query = `
        UPDATE pedidos
        SET direccion = ?, telefono = ?
        WHERE id_pedido = ?
    `;
    conexion.query(query, [direccion, telefono, id_pedido], (error, results) => {
        if (error) {
            console.error('Error al actualizar pedido:', error);
            return res.status(500).send('Error al actualizar el pedido.');
        }
        res.send({ message: 'Pedido actualizado correctamente.' });
    });
});

app.listen(PORT, function(){ //Le damos el puerto y l funcion que se ejecutara
    console.log("Servidor en funciomaniento", PORT); //Mensaje que se mostrara en la consola
});