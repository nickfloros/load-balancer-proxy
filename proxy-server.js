const http = require('http'),
	EventEmmiter = require('events'),
	HealthCheck = require('./health-check.js'),
	httpProxy = require('http-proxy'),
	argParams = process.argv.splice(2);


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
	path: '/res/read/rest/vehicle?vrn=NO_REG',
	proxyTimeout: 2000,
	event: myEvents
}, {
	id: id++,
	status: 0,
	target: 'http://localhost:8003',
	path: '/res/read/rest/vehicle?vrn=NO_REG',
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

const regTest = /(application\/(xml|json);?)/gmi;

function validContentType(headers) {
	headers.split(';')

}

// we should have only one of those ... 
myEvents.once('proxyActive', () => {
	let nextServerId = 0;
	// we now start the listenning for inbound connections 
	http.createServer(function (req, res) {
		let inactive = 0;
		const validContent = regTest.test(req.headers['content-type'] || req.headers['Content-Type']);
		console.log(regTest.test(req.headers['content-type'] || req.headers['Content-Type']));

		if (validContent) {

			// find next active instance ..
			while (!proxyServers[nextServerId].status && inactive < proxyServers.length) {
				nextServerId = (nextServerId + 1) % proxyServers.length;
				inactive++;
				console.log(`inactive server ${nextServerId} ${inactive}`);
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
					serverId: nextServerId
				});
				res.statusCode = 400;
				res.end();
			}

			console.log(`post to ${proxyServers[nextServerId].target}`);

			// peek next one ..
			nextServerId = (nextServerId + 1) % proxyServers.length;
		} else {
			res.statusCode = 400;
			res.end();
		}

	}).listen(argParams[0] || 8000);

});

myEvents.on('active', (msg) => {
	proxyServers[msg.serverId].status = 1;
});

myEvents.on('error', (msg) => {
	let activeCounter = 0;
	console.log(msg);
	proxyServers[msg.serverId].status = 0;

	console.log(JSON.stringify(msg));

	// count number of active entries
	proxyServers.forEach((entry) => {
		activeCounter += entry.status;
	});
	console.log(JSON.stringify(msg), activeCounter);
	if (activeCounter === 0) {
		myEvents.emit('end');
	}

});

myEvents.once('end', () => {
	// create alert ... 

	// terminate 
	process.exit(1);
});

HealthCheck.test(proxyServers[0]);
HealthCheck.test(proxyServers[1]);
HealthCheck.test(proxyServers[2]);