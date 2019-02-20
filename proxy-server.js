const http = require('http'),
	winston = require('winston'),
	EventEmmiter = require('events'),
	HealthCheck = require('./health-check.js'),
	httpProxy = require('http-proxy'),
	argParams = process.argv.splice(2);

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.logstash(),
	defaultMeta: {
		service: 'proxy-server'
	},
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log` 
		// - Write all logs error (and below) to `error.log`.
		//
		new winston.transports.File({
			filename: 'proxy-server-error.log',
			level: 'error'
		}),
		new winston.transports.File({
			filename: 'proxy-server-combined.log'
		}),
		new winston.transports.Console()
	]
});

const myEvents = new EventEmmiter();

let id = 0;

const proxyServers = [{
	id: id++,
	status: -1,
	target: 'http://localhost:8001',
	proxyTimeout: 2000,
	teatQuery: '/res/read/rest/vehicle?vrn=NO_REG',
	event: myEvents,
	genericTimeout: 5000
}, {
	id: id++,
	status: -1,
	target: 'http://localhost:8002',
	teatQuery: '/res/read/rest/vehicle?vrn=NO_REG',
	proxyTimeout: 2000,
	event: myEvents,
	genericTimeout: 5000
}, {
	id: id++,
	status: -1,
	target: 'http://localhost:8003',
	teatQuery: '/res/read/rest/vehicle?vrn=NO_REG',
	proxyTimeout: 2000,
	event: myEvents,
	genericTimeout: 5000
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
myEvents.once('proxyActive', (msg) => {
	let nextServerId = 0;
	logger.info(`activating proxy because one server is active ${proxyServers[msg.serverId].target}`);
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
				logger.warn(`no available servers ...  about to terminate `);
				myEvents.emit('error', {
					serverId: nextServerId
				});
				res.statusCode = 503;
				res.end();
			}

			console.log(`post to ${proxyServers[nextServerId].target}`);

			// peek next one ..
			nextServerId = (nextServerId + 1) % proxyServers.length;
		} else {
			logger.warn(`received a bad request `);
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

	proxyServers[msg.serverId].status = 0;

	console.log(JSON.stringify(msg));

	// count number of active entries
	proxyServers.forEach((entry) => {
		activeCounter += entry.status;
	});
	logger.warn(`server ${proxyServers[msg.serverId].target} is offline - still we have ${activeCounter} servers`);

	if (activeCounter === 0) {
		myEvents.emit('end');
	}

});

myEvents.once('end', () => {
	logger.error(`no active servers terminating`);
	// create alert ... 

	// terminate 
	process.exit(1);
});

logger.info(`starting monitor health checks`);

HealthCheck.test(proxyServers[0]);
HealthCheck.test(proxyServers[1]);
HealthCheck.test(proxyServers[2]);