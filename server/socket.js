const requestSecret = require("/var/app/current/requestSecret.json")
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  // ...
});



const { resolve } = require("bluebird");

var clients = {}
var waitingQueue = {}

function getIp(socket){
    return socket.handshake.address.replace("::ffff:","");
}
io.on('connection', socket => { 

     var clientIp = getIp(socket);

     clients[clientIp] = socket;
     if(waitingQueue[clientIp]){
         waitingQueue[clientIp]()
         delete waitingQueue[clientIp]
     }

    socket.on("disconnect", () => {

        delete clients[clientIp]
    })
    
   


});


function waitForConnection(ip){
    return new Promise (resolve => {
        if(clients[ip]){
            resolve()
        }
        waitingQueue[ip] = resolve
    })
}

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
},60000)

function sendSocket(obj, ip){
    return new Promise((resolve, reject) => {

        var expiry = new Date().getTime() + (1000*60*15)

        if(clients[ip] && typeof clients[ip] !== "undefined" && clients[ip].emit){
            clients[ip].emit('req', { req: obj, secret: requestSecret.secret }, resolve);
        }else{
            reject()
        }
        
    })
}
httpServer.listen(3233);
module.exports = {
    ping, scrape, waitForConnection
}