const requestSecret = require("/var/app/current/requestSecret.json")
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  // ...
});



var bcrypt = require('bcryptjs');

var clients = {}


function getIp(socket){
    return socket.handshake.address.replace("::ffff:","");
}
io.on('connection', socket => { 

     var clientIp = getIp(socket);

     clients[clientIp] = socket;
    socket.on("disconnect", () => {

        delete clients[clientIp]
    })
    
    console.log("connection",clientIp)


});

function ping(ip){
    return sendSocket({
        action: "ping"
    }, ip)
}

function scrape(req, ip){
    return sendSocket({
        action: "scrape",
        url: req.url,
        headers: req.headers
    }, ip)
}
setInterval(()=>{
    console.log(Object.keys(clients))
},5000)

function sendSocket(obj, ip){
    return new Promise((resolve, reject) => {
        if(!clients[ip]){
            reject()
            return;
        }
        var expiry = new Date().getTime() + (1000*60*15)
        bcrypt.hash(`${JSON.stringify(obj)}-${requestSecret.secret}-${expiry}`, 10, function(err, hash) {
  
            
            clients[ip].emit('req', { req: obj, hash, expiry }, resolve);
        });
    })
}
httpServer.listen(3233);
module.exports = {
    ping, scrape
}