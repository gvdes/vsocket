// ❰❰❰❰❰ D E S A R R O L L O ❱❱❱❱❱
const allowedSites = [
    'http://localhost:2100',
    'http://localhost:9000',
    'http://localhost:2200',// para que se conecte al restock
    'http://localhost:8080',// para que se conecte al restock
    // 'http://localhost:2200',// para que se conecte al restock

    'http://192.168.10.112:2200',// para que se conecte al restock
    'http://192.168.10.112:9000',// para que se conecte al restock


    'http://192.168.10.189:2200',
    'http://192.168.10.112:8080',

    'http://192.168.30.253:1619',

    'http://192.168.10.189:7007',
    'http://192.168.10.46:7007',
    'http://192.168.10.189:6699',
    'http://192.168.10.238:2314',
    'http://192.168.10.238:1308',
    'http://192.168.12.183:2100',
    'http://mx100-cedis-mkrqpwcczk.dynamic-m.com:4546',
    'http://mx100-cedis-mkrqpwcczk.dynamic-m.com:6006'
];

console.log("Reiniciado...");
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http,{ cors:{ origin:allowedSites } });
const port = 4141;
// var io = require('socket.io')(http,{ cors:{ origin:allowedSites, credentials: false } });
// instrument(io, { auth: false });

http.listen(port, () => { console.log(`Socket running on ${port}`); });
// fs.writeFileSync('error_log.json','Hola');

const counters = io.of('/counters');
const preventa = io.of('/preventa');
const resurtidos = io.of('/resurtidos');
const clients = [];
// const resurtido = io.of('/resurtido');

let time = time => `${time.getFullYear()}-${time.getMonth()}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;

io.on('connection', socket =>{
    console.log("\n\n\n ===================================================================================== ");
    console.log(` === ❰❰❰❰❰ [${time(new Date())}] ${socket.id} has been connected in GSOCKET!!! ❯❯❯❯❯ ===`);
    console.log(" ===================================================================================== \n\n\n");
});

counters.on('connection',counter=>{
    console.log("\n\n\n\n\n=============================================");
    console.log(`[${time(new Date())}]: ❰❰❰❰❰ Nueva conexion a INVENTARIOS ❯❯❯❯❯`);

    counter.on('index',gdata=>{ console.log(`[${time(new Date())}]: ${gdata.me.names} ${gdata.me.surname_pat} [${gdata.me.nick}] de ${gdata.workpoint.name} [${gdata.workpoint.alias}] ha ingresado al home de Inventarios`); });

    counter.on('joinat',gdata=>{
        let room = gdata.room;
        let user = gdata.user;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;

        console.log(`Uniendo a sala: ${room}`);
        counter.join(room);
        console.log(`${msg} se ha unido al ROOM: ${room}`);
        counters.in(room).emit('joined',user);
        console.log("\n=============================================");
    });

    counter.on('counting',gdata=>{
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} esta contando un elemento`);

        counter.broadcast.to(room).emit('counting',{by:user, product:product});
    });

    counter.on('cancelcounting',gdata=>{
        // console.log(gdata);
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} ha cancelado el conteo en el ROOM: ${room}`);
        counter.broadcast.to(room).emit('cancelcounting',{by:user, product:product});
    });

    counter.on('countingconfirmed',gdata=>{
        // console.log(gdata);
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;
        let settings = gdata.settings;
        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} ha confirmado el conteo en el ROOM: ${room}`);

        counter.broadcast.to(room).emit('countingconfirmed',{by:user, product:product, settings:settings});
    });
});

// const socketsin = (nmspc,room) => { return io.of("/"+nmspc).in(room).allSockets(); }

preventa.on('connection', socket =>{
    console.log(" ================================================================================= ");
    console.log(` == [${time(new Date())}]: ❯❯❯❯❯ Nueva conexion a PREVENTA (${socket.id}) ==`);
    console.log(" ================================================================================= \n");

    socket.emit('socketid',socket.id);

    socket.on('join', ({ profile, workpoint, room }) => {

        try {
            let user = profile.me.nick;// nombre dle usuairo a conectar
            let branch = workpoint.alias; // nombre de sucursal de conexion de origen
            let _room = `PRV_${branch}_${room}`;// nombre del room a crear
            let _admins = `PRV_${branch}_admins`;// nombre del room a crear

            socket.join(_room);
            console.log(`[${time(new Date())}]: ❯❯❯❯❯ ${user} de ${branch} se unio a ${_room}\n`);
            socket.emit('joinedat', { profile, workpoint, room:_room });

            socket.in(_admins).in(_room).emit('newjoin', { profile, workpoint, room:_room });
        } catch (error) {
            let newerror = { error, time:time(new Date()), msg:'No se pudo leer la propiedad solicitada' };
            let msgsave = JSON.stringify(newerror);
            // fs.writeFileSync('error_log.json',msgsave);
        }
    });

    socket.on('unjoin', ({ profile, workpoint, room }) => {

        try {
            let nick = profile.me.nick;
            let branch = workpoint.alias;
            let _room = `PRV_${workpoint.alias}_${room}`;

            socket.emit('unjoined', { profile, workpoint, room:_room });
            socket.to(_room).emit('socketunjoined', { profile, workpoint, room:_room });
            socket.leave(_room);

            console.log(`[${time(new Date())}]: ❰❰❰❰❰ ${nick} de ${branch} salio de ${_room}\n`);

        } catch (error) {
            socket.emit('unjoin_crash',{error});

            let newerror = { error, time:time(new Date()), msg:'No se pudo leer la propiedad solicitada' };
            let msgsave = JSON.stringify(newerror);
            // fs.writeFileSync('error_log.json',msgsave);
        }

    });

    socket.on('order_add', data => {
        try {
            let order = data.order.id;
            let by = data.order.created_by.nick;
            let branch = data.order.from.alias;
    
            let _admins = `PRV_${branch}_admins`;
            let _sales = `PRV_${branch}_sales`;
    
            console.log(`[${time(new Date())}]: --❯ ${by} de ${branch} creo el pedido ${order} (${data.order.name})\n`);
            socket.to(_admins).to(_sales).emit('order_add', data);
        } catch (error) {
            let newerror = { error, time:time(new Date()), msg:'No se pudo leer la propiedad solicitada' };
            let msgsave = JSON.stringify(newerror);
        }
    });

    socket.on('order_update', data => {
        // console.log("Una orden fue actualizada");
        // console.log(data);
        let order = data.order.id;
        let newstate = data.newstate;
        let branch = data.order.from.alias;

        let _admins = `PRV_${branch}_admins`;
        let _sales = `PRV_${branch}_sales`;
        let _checkin = `PRV_${branch}_checkin`;
        let _supply = `PRV_${branch}_supply`;
        let _checkout = `PRV_${branch}_checkout`;
        let _cfg = `PRV_${branch}_cfg`;

        console.log(`[${time(new Date())}]: ==❯ La orden ${order} (${branch}) ha cambiado a "${newstate.name}" -> (${newstate.id})\n`);

        // console.log(branch);

        /**
         * Ya que tanto admins como sales reciben todos los pedidos que se crean,
         * siempre se les notificara de un cambio de status...
         */
        socket.to(_admins).to(_sales).emit('order_update', data);

        /**
         * adicional a ello, algunas salas tambien deben de recibir la notificacion
         * para crear o modificar los pedidos en preventa dependiendo del :
         */

        switch (newstate.id) {
            case 3:
                /**
                 * El pedido paso a CHECKIN
                 * notificar al room _checkin de un nuevo pedido (agregarlo)
                 */
                socket.to(_checkin).emit('order_add', data);
            break;

            case 4:
                /**
                 * El pedido paso a POR SURTIR
                 * notificar al room supply de un nuevo pedido (agregarlo)
                 * notificar al room checkin de un cambio de status
                 */
                socket.to(_supply).emit('order_add', data);
                socket.to(_checkin).emit('order_update', data);
            break;

            case 5: case 7:
                socket.to(_supply).to(_checkout).emit('order_aou', data);
            break;

            case 100:
                socket.to(_cfg).emit('order_update', data);
            break;

            default:
                console.log("La orden cambio a un status no registrado!!");
            break;
        }
    });

    socket.on('module_update', ({profile,workpoint,state}) => {
        let by = profile.me.nick;
        let branch = workpoint.alias;
        let _msgstate = state.state ? 'encendio':'apago';
        let _room = `PRV_${workpoint.alias}_cfg`;

        console.log(`[${time(new Date())}]: --❯ ${by} de ${branch} ${_msgstate} el modulo ${state.name}.\n`);
        socket.to(_room).emit('module_update',{by,_msgstate,state});
    });

    socket.on('cash_update', ({profile,workpoint,cash,newstate}) => {
        let by = profile.me.nick;
        let branch = workpoint.alias;
        let _msgstate = newstate.id==1 ? `${by} encendio la ${cash.name}`:`${by} apago la ${cash.name}`;
        let _room = `PRV_${branch}_cfg`;

        console.log(`[${time(new Date())}]: --❯ ${_msgstate}.\n`);
        socket.to(_room).emit('cash_update',{by,cash,newstate});
    });

    socket.on('disconnect', data =>{
        console.log("\nun usuario abandono el CANAL PREVENTA\n");
    });
});

// resurtidos.on('connection',socket=>{
//     console.log("\n\n\n\n\n=============================================");
//     console.log("❰❰❰❰❰ Nueva conexion a RESURTIDOS ❯❯❯❯❯");

//     /**
//      * Canal global para WORKPOINTS
//      * Canal entre CEDIS
//      */

//     dashboard.on('disconnect',()=>{ console.log("\nun usuario abandono el canal resurtidos\n"); });
// });

resurtidos.on('connection',dashboard=>{
    console.log("\n\n\n\n\n=============================================");
    console.log("❰❰❰❰❰ Nueva conexion a RESURTIDOS ❯❯❯❯❯");

    dashboard.on('joinat',gdata=>{
        console.log(gdata);
        //let roomdash = `DASHREQ-${gdata.room}`;// nombre del room a unirse
        let roomdash = `DASHBOARDSREQS`;// nombre del room a unirse
        console.log("uniendose a room "+roomdash);//
        let user = gdata.profile;
        let from = gdata.workpoint;
        dashboard.join(roomdash);
        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}] se unio a resurtidos y al room ${roomdash}`;
        console.log(msg);

        // envia a todos en el room EXCEPTO al emisor
        // dashboard.to(roomdash).emit( 'joineddashreq', {user:user, notify:msg } );

        // envia a todos en el room, INCLUYENDO al emisor
        resurtidos.to(roomdash).emit( 'joineddashreq', { user:user, notify:msg, fromdashboard:gdata.isdashboard, from:from } );
        console.log("\n=============================================");
    });

    dashboard.on('creating',gdata=>{
        let roomdash = `DASHBOARDSREQS`;// nombre del room a unirse
        console.log("Se esta levantando un pedido");
        console.log(roomdash);
        console.log(gdata);
        resurtidos.to(roomdash).emit('creating',gdata);
    });

    dashboard.on('order_open',gdata=>{
        console.log(gdata);
        let roomdash = `DASHBOARDSREQS`;
        console.log(gdata.cmd);
        resurtidos.to(roomdash).emit('order_open',gdata);
    });

    dashboard.on('order_update',gdata=>{
        console.log(gdata);
        let roomdash = `DASHBOARDSREQS`;
        // console.log(`${gdata.profile.me.nick} abrio la orden ${gdata.order.id}`);
        resurtidos.to(roomdash).emit('order_update',gdata);
    });

    dashboard.on('order_changestate',gdata=>{
        console.log("actualizando pedido...");
        let roomdash = `DASHBOARDSREQS`;
        // console.log(`${gdata.profile.me.nick} de ${gdata.profile.workpoint.alias} ha cambiado el status de la orden ${gdata.order.id} a ${gdata.state.id} (${gdata.state.name})`);

        resurtidos.to(roomdash).emit('order_changestate',gdata);
    });

    dashboard.on('order_refresh',gdata=>{
        console.log("refrescando pedido...");
        let roomdash = `DASHBOARDSREQS`;
        // // console.log(`${gdata.profile.me.nick} de ${gdata.profile.workpoint.alias} ha cambiado el status de la orden ${gdata.order.id} a ${gdata.state.id} (${gdata.state.name})`);

        resurtidos.to(roomdash).emit('order_refresh',gdata);
    });

    // orderpartition_refresh

    dashboard.on('orderpartition_refresh',gdata=>{
        console.log("refrescando pedido...");
        let roomdash = `DASHBOARDSREQS`;
        // // console.log(`${gdata.profile.me.nick} de ${gdata.profile.workpoint.alias} ha cambiado el status de la orden ${gdata.order.id} a ${gdata.state.id} (${gdata.state.name})`);

        resurtidos.to(roomdash).emit('orderpartition_refresh',gdata);
    });

    dashboard.on('leave',(gdata)=>{
        // console.log(gdata);
        console.log('Saliendo de los rooms resurtidos...');
        dashboard.disconnect();
    });

    // dashboard.on('changeStatusRequisition', chst => {
    //     console.log(chst)
    //     resurtidos.emit('changeStatusRequisition',chst)
    // })
    // dashboard.on('changeStatusPartition', chst => {
    //     console.log(chst)
    //     resurtidos.emit('changeStatusPartition',chst)
    // })

    dashboard.on('disconnect',()=>{ console.log("\nun usuario abandono el canal resurtidos\n"); });
});


// function* iterate(array){
//     for (let value of array){ yield value; };
// }

// const it = iterate(["MariJose","Viridiana","Itzel","Lizeth","Liliana","Alexa","Diana","Yadi","Dennis","Sandra","Sarah"]);

// console.log(it.next().value);