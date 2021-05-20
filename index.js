/**
 * npm run dev
 */
const allowedSites = ['http://192.168.1.247:24700','http://localhost:24700','http://vizappdev.grupovizcarra.net:7007','http://192.168.1.222:4001'];
console.log("Reiniciado...");
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http,{ cors:{ origin:allowedSites } });

http.listen(7171, () => { console.log('listening on *:7171'); });

const counters = io.of('/counters');
const preventa = io.of('/preventa');
const resurtidos = io.of('/resurtidos');

io.on('connection',con=>{ console.log("❰❰❰❰❰ Nueva conexion al socket ❯❯❯❯❯"); });

counters.on('connection',counter=>{

    let time = (time)=>{ return `${time.getFullYear()}-${time.getMonth()}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`; };

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

preventa.on('connection',pv=>{
    console.log("\n\n\n\n\n=============================================");
    console.log("❰❰❰❰❰ Nueva conexion PREVENTA ❯❯❯❯❯");

    pv.on('joinat',gdata=>{
        // console.log(gdata);
        let room = `PRV-${gdata.from.workpoint.alias}`;
        let roomdash = `DASHPRV-${gdata.room}`;
        
        let user = gdata.user;
        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        
        pv.join(room);
        pv.join(roomdash);
        console.log(`Se unio a la preventa: ${room}`);
        console.log(`Uniendo al dashboard de preventa: ${room}`);
        console.log("\n=============================================");

        // preventa.on(room).emit( 'joinprev', {user:user,notify:`${msg} se ha unido al room ${room}` } );
        // preventa.on(roomdash).emit( 'joinprevwrh', {user:user,notify:`${msg} se ha unido al room ${roomdash}` } );
    });

    pv.on('order_creating', gdata =>{
        console.log("Creando pedido");
        let room = `PRV-${gdata.room}`;
        let roomdash = `DASHPRV-${gdata.room}`;
        let user = gdata.user;
        
        // console.log(gdata);
        preventa.in(roomdash).emit( 'order_creating', { user:user } );
    });

    pv.on('order_created', gdata =>{
        console.log("Nuevo pedido creado");
        let room = `PRV-${gdata.room}`;
        let roomdash = `DASHPRV-${gdata.room}`;

        // console.log(gdata);
        preventa.in(roomdash).emit( 'order_created', { user:user } );
    });

    pv.on('leave',()=>{
        console.log('Saliendo de los rooms preventa...');
        pv.disconnect();
    });

    pv.on('disconnect',()=>{ console.log("\nun usuario abandono el ROOM preventa\n"); });
});

resurtidos.on('connection',dashboard=>{
    console.log("\n\n\n\n\n=============================================");
    console.log("❰❰❰❰❰ Nueva conexion a RESURTIDOS ❯❯❯❯❯");

    dashboard.on('joinat',gdata=>{
        //let roomdash = `DASHREQ-${gdata.room}`;// nombre del room a unirse
        let roomdash = `DASHBOARDSREQS`;// nombre del room a unirse
        console.log("uniendose a room "+roomdash);// 
        let user = gdata.user;
        let from = gdata.from;
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

    dashboard.on('leave',(gdata)=>{
        // console.log(gdata);
        console.log('Saliendo de los rooms resurtidos...');
        dashboard.disconnect();
    });

    dashboard.on('disconnect',()=>{ console.log("\nun usuario abandono el canal resurtidos\n"); });
});