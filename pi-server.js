var args = process.argv.splice(2);
var http = require('http');

/**
 * This function estimates pi using Monte-Carlo integration
 * https://en.wikipedia.org/wiki/Monte_Carlo_integration
 * @returns {number}
 */
function estimatePi() {
  var n = 10000000,
    inside = 0,
    i, x, y;

  for (i = 0; i < n; i++) {
    x = Math.random();
    y = Math.random();
    if (Math.sqrt(x * x + y * y) <= 1)
      inside++;
  }

  return 4 * inside / n;
}

let hitCounter = 0;
// Create a basic server that responds to any request with the pi estimation
var server = http.createServer(function (req, res) {
  console.log(`port ${args[0]} hits : ${hitCounter} timeout : ${(args[0] === '8003' && hitCounter % 2 === 0) ? 10000 : 100}`);
  setTimeout(() => {
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      pi: estimatePi(),
      port: args[0]
    }));
  }, (args[0] === '8003' && hitCounter % 2 === 0) ? 10000 : 100);
  hitCounter++;
});

// Listen to a specified port, or default to 8000
server.listen(args[0] || 8000);