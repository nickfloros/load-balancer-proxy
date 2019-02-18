const http = require('http');

class HealthCheck {

  constructor(parms) {
    this._params = params;
    this._status = 0;
  }

  get status => this._status

  set status(val) {this._status = val; }

  static test(params) {
    setInterval(() => {
      const req = http.get({
        host: 'localhost',
        port: 8003,
        path: params.path
      }, (res) => {
        let bodyChunks = [];

        res.on('data', (chunk) => {
          bodyChunks.push(chunk);
        })

        res.on('end', () => {
          testCounter++;
          params.event.emit('active',{serverId:params.id});
          if (testCounter===1) {
            params.event.emit('serverActive');
          }
        });

        res.on('error', (e) => {
          params.event.emit('error',{type:'server'});
        });

      });

      req.setTimeout(2000, () => {
        params.event.emit('error',{type:'timeout'});
      });

      req.on('error', () => {
        params.event.emit('error',{type:'connection'});
      })
    }, 3000);
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