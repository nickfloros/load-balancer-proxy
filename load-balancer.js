const arguments = process.argv.splice(2),
 http = require('http'),
 httpProxy = require('http-proxy');

//
// Addresses to use in the round robin proxy
//
const addresses = [
    {
        host: 'localhost',
        port: 8001
    },
    {
        host: 'localhost',
        port: 8002
    },
    {
        host: 'localhost',
        port: 8003
    }
];
const a = [{
    target : 'http://localhost:8001'
    },{
    target : 'http://localhost:8002'
    },{
    target : 'http://localhost:8003'
    }];

const proxy = httpProxy.createProxyServer();

var i = 0;
proxy.on('error',(err, req, res)=>{
    res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
     
      res.end(JSON.stringify({msg:'Something went wrong. And we are reporting a custom error message.', err:err}));
});

http.createServer(function (req, res) {
    try {
        proxy.web(req, res, a[i]);
    }
    catch (e) {
        console.log('failed ..');
    }
    console.log(`post to ${a[i].target}`);
    i = (i + 1) % addresses.length;
}).listen(arguments[0] || 8000);