const io = require('socket.io-client');
var bcrypt = require('bcryptjs');
const socket = io('http://cetlalpha.us-east-2.elasticbeanstalk.com:3233');
const axios = require("axios")

socket.connect()
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });
  socket.on("connection", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });
  socket.on("disconnect", () => {
    socket.connect()
    console.log(socket.id); // undefined
  });

socket.on('req', (obj, fn) => {
        bcrypt.compare(`${JSON.stringify(obj.req)}-REQUESTSECRET-${obj.expiry}`, obj.hash).then(async result => {
            if(result === true && new Date().getTime() < obj.expiry && obj.expiry < (new Date().getTime()+(60*60*1000))){
                console.log("CLIENT REQ WILL SUCCEED",obj.req)
                switch(obj.req.action){
                    case "ping":
                        fn({status: true, message: "pong"});
                    break;
                    case "scrape":
                        var response = await request(obj.req)
                        fn(response)
                    break;
                }
            }else{
                console.log("CLIENT REQ WILL FAIL",obj, result)
            }
        
        });
})


function request(req){
    return new Promise(async resolve => {
        var response = await axios({
            url: req.url,
            headers: {
              "User-Agent": req.userAgent
            }
        })
        resolve({
            url: req.url,
            headers: response.headers,
            body: response.data,
            statusCode: response.status
        })
    })
    
}


