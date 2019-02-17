const arguments = process.argv.splice(2),
	http = require('http'),
	EventEmmiter = require('events'),
	httpProxy = require('http-proxy');

const myEvents = new EventEmmiter();

const proxyInactive = 1;
myEvents.on('targetServerActive',()=>{
	if (proxyInactive) {

	proxyInactive=0;
	}
});

myEvent.on('targetServerDead',()=>{
	// terminate proxy ..
	process.exit(1);
});

// check every 45 seconds target server is active ..
setInterval(()=>{
		
}, 45000); 


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
	id : 0,
	status: 1,
	target: 'http://localhost:8001',
	proxyTimeout: 2000
}, {
	id : 1,
	status: 1,
	target: 'http://localhost:8002',
	proxyTimeout: 2000
}, {
	id : 2,
	status: 1,
	target: 'http://localhost:8003',
	proxyTimeout: 2000
}];

const proxy = httpProxy.createProxyServer();

var i = 0;
proxy.on('error', (err, req, res) => {
	res.writeHead(500, {
		'Content-Type': 'text/plain',
	});

	res.end(JSON.stringify({
		msg: 'Something went wrong. And we are reporting a custom error message.',
		err: err,
		resStatus : res.statusCode,
		target: req.proxy.target,
		timeout : res.timeout || false
	}));
	//a[req.proxy.id].status=0;
});




http.createServer(function (req, res) {
	let inactive = 0;

	// find active instance ..
	while (!a[i].status && inactive < a.length) {
		i = (i + 1) % addresses.length;
	}

	if (a[i].status) {
		req.proxy = a[i];
        // time out response 
		res.setTimeout(a[i].proxyTimeout,(a)=>{
			res.timeout = 1;
		});
	
		proxy.web(req, res, a[i]);
	}
	
	console.log(`post to ${a[i].target}`);
	// peek next one ..
	i = (i + 1) % addresses.length;

}).listen(arguments[0] || 8000);

