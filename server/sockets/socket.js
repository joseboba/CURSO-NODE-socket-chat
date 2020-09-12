const { io } = require('../server');
const { Usuarios } = require('../classes/usuario');
const { crearMensaje } = require('../utilidades/utilidades')

const usuarios = new Usuarios();

io.on('connection', (client) => {
    
     client.on('entrarChat', (data, callback) => {
        
        if(!data.nombre || !data.sala){
            return callback({
                error: true,
                mensaje: 'El nombre y la sala es necesario'
            })
        }

        client.join(data.sala);

        usuarios.agregarPersona( client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió`))

        callback(usuarios.getPersonasPorSala(data.sala));


     })

     


     client.on('disconnect', () => {
         let personaBorrada = usuarios.borrarPersona( client.id );
         
        if(!personaBorrada){
            throw new Error('No se ha encontrado a la persona')
        }

         client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre }, salió`))
         client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));

     })

     client.on('crearMensaje', (data, callback) => {

         let personas = usuarios.getPersona(client.id);
         let mensaje = crearMensaje( personas.nombre, data.mensaje )

         client.broadcast.to(personas.sala).emit('crearMensaje', mensaje)
         callback(mensaje)
     })

     //Mesajes privados
     client.on('mensajePrivado', (data) => {

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje))

     })


});