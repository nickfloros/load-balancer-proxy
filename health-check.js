const http = require('http'),
  EventEmmiter = require('events');

class Counters {
  constructor() {
    this.success=0;
    this.failures = 0;
  }
}

class HealthCheck {
  static test(params) {
    const testCounter = 0;

    setInterval(() => {
      const req = http.get({
        host: 'localhost',
        port: 8003,
        path: '/'
      }, (res) => {
        let bodyChunks = [];

        console.log(res.statusCode);

        res.on('data', (chunk) => {
          bodyChunks.push(chunk);
        })

        res.on('end', () => {
          testCounter++;
          params.event.emit('active');
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

const myEvent = new EventEmmiter();

HealthCheck.test({
  timeout: 2000,
  event: myEvent
});


myEvent.on('error',(e)=>{
  console.log(e);
});