const b = process.argv.splice(2),
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
	
	const htime = process.hrtime();
	// find active instance ..
	while (!a[i].status && inactive < a.length) {
		i = (i + 1) % addresses.length;
	}

	if (a[i].status) {
		req.proxy = a[i];

		res.setTimeout(a[i].proxyTimeout,(a)=>{
			res.timeout = 1;
		});
	
		proxy.web(req, res, a[i]);

		res.on('finish',(st)=>{
			const hdiff = process.hrtime(htime);
			var utc = new Date().toJSON();//.slice(0,10).replace(/-/g,'/');

			console.log(`${utc}, ${req.url},${req.method},${res.statusCode},${hdiff[0]*1000 + hdiff[1]/1000000} ms `);
		});
	}
	// peek next one ..
	i = (i + 1) % addresses.length;


}).listen(b[0] || 8000);

