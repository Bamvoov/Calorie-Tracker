const http = require('http');
const data = JSON.stringify({ foodInput: "apple", userId: null });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/log-food',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`STATUS: ${res.statusCode}`, body.slice(0, 1000)); });
});
req.on('error', (e) => { console.error(`Error: ${e.message}`); });
req.write(data);
req.end();
