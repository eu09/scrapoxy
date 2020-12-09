const io = require('socket.io-client');
const socket = io('SERVER URL',
{
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: Infinity
});
const axios = require("axios")

socket.connect()
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx

  });
  socket.on("connection", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });
  socket.on("disconnect", () => {
      setTimeout(() => {
          console.log("Reconnecting...")
        socket.connect()
      }, 1000)
    
    
    console.log(socket.id); // undefined
  });

socket.on('req', async (obj, fn) => {
    switch(obj.req.action){
        case "ping":
            fn({status: true, message: "pong"});
        break;
        case "scrape":
            var response = await request(obj.req)
            fn(response)
        break;
    }
         
})


function request(req){
    return new Promise(async resolve => {
        
        await axios({
            url: req.url,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.5',
                'accept-encoding': 'gzip, deflate',
                dnt: '1',
                connection: 'keep-alive',
                'upgrade-insecure-requests': '1',
                ...req.headers
            },
            maxRedirects: 0
        })
        .then(response => {
            resolve({
                url: req.url,
                headers: response.headers,
                body: response.data,
                statusCode: response.status
            })
        })
        .catch(error => {
            resolve({
                url: req.url,
                headers: error.response.headers,
                body: error.response.data,
                statusCode: error.response.status
            })
        })
        
    })
    
}