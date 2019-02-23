const http = require('http'),
  URL = require('url');

class HealthCheck {

  constructor(parms) {
    this._params = params;
    this._status = 0;
  }

  get status() {
    return this._status;
  }

  set status(val) {
    this._status = val;
  }

  static test(params) {
    const url = URL.parse(params.target);
    let testCounter = 0;

    setInterval(() => {

      const req = http.get({
        host: url.hostname,
        port: url.port,
        path: params.testQuery
      }, (res) => {
        let bodyChunks = [];

        res.on('data', (chunk) => {
          bodyChunks.push(chunk);
        })

        res.on('end', () => {
          testCounter++;
          params.event.emit('active', {
            serverId: params.id
          });
          if (testCounter === 1) {
            params.event.emit('proxyActive',{
              serverId : params.id
            });
          }
        });

        res.on('error', (e) => {
          params.event.emit('error', {
            type: 'server'
          });
        });

      });

      req.setTimeout(2000, () => {
        params.event.emit('error', {
          type: 'timeout',
          serverId: params.id
        });
      });

      req.on('error', () => {
        params.event.emit('error', {
          serverId: params.id,
          type: 'connection'
        });
      })
    }, 10000);
  }

}

module.exports = HealthCheck;

/*
const myEvent = new EventEmmiter();

HealthCheck.test({
  timeout: 2000,
  event: myEvent
});


myEvent.on('error',(e)=>{
  console.log(e);
});*/
