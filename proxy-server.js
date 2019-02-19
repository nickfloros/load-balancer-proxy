const http = require('http'),
	EventEmmiter = require('events'),
	HealthCheck = require('./health-check.js'),
	httpProxy = require('http-proxy');


const myEvents = new EventEmmiter();

let id = 0;

const proxyServers = [{
	id: id++,
	status: 0,
	target: 'http://localhost:8001',
	proxyTimeout: 2000,
	path: '/res/read/rest/vehicle?vrn=NO_REG',
	event: myEvents
}, {
	id: id++,
	status: 0,
	target: 'http://localhost:8002',
	path = '/res/read/rest/vehicle?vrn=NO_REG'
	proxyTimeout: 2000,
	event: myEvents
}, {
	id: id++,
	status: 0,
	target: 'http://localhost:8003',
	path: '/res/read/rest/vehicle?vrn=NO_REG'
	proxyTimeout: 2000,
	event: myEvents
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
		resStatus: res.statusCode,
		target: req.proxy.target,
		timeout: res.timeout || false
	}));

	//proxyServers[req.proxy.id].status=0;
});

// we should have only one of those ... 
myEvents.once('serviceActive', () => {
	let nextServerId = 0;
	// we now start the listenning for inbound connections 
	http.createServer(function (req, res) {
		let inactive = 0;

		// find next active instance ..
		while (proxyServers[nextServerId].status && inactive < proxyServers.length) {
			nextServerId = (nextServerId + 1) % proxyServers.length;
			inactive++;
		}

		if (proxyServers[nextServerId].status) {
			req.proxy = proxyServers[nextServerId];
			// time out response 
			res.setTimeout(proxyServers[nextServerId].proxyTimeout, (a) => {
				res.timeout = 1;
			});

			proxy.web(req, res, proxyServers[nextServerId]);
		} else {
			myEvents.emit('error', {
				id: nextServerId
			});
		}

		console.log(`post to ${proxyServers[i].target}`);

		// peek next one ..
		nextServerId = (nextServerId + 1) % addresses.length;

	}).listen(argParams[0] || 8000);
});

myEvents.on('error', (err) => {
	console.log(err);
	process.exit(1);
});

myEvents.on('active', (msg) => {
	proxyServers[msg.id].status = 1;
});

myEvents.on('error', (msg) => {
	let activeCounter = 0;
	proxyServers[msg.id].status = 0;

	// count number of active entries
	a.forEach((entry) => {
		activeCounter += entry.status;
	});

	if (activeCounter === 0) {
		myEvents.emit('end');
	}

});

myEvents.once('end', () => {
	// create alert ... 

	// terminate 
	process.exit(1);
})