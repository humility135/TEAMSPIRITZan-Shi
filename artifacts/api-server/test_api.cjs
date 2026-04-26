const http = require('http');

const data = JSON.stringify({
  venueAddress: "Test Venue",
  datetime: "2025-04-26T11:22:00+08:00",
  endDatetime: "2025-04-26T13:22:00+08:00",
  fee: 10,
  surface: "hard",
  skillLevel: 3,
  maxPlayers: 10,
  description: "",
  rules: "",
  refundPolicy: "half"
});

const req = http.request('http://127.0.0.1:5003/api/public-matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log("POST Response:", body);
    
    // Now fetch it
    http.get('http://127.0.0.1:5003/api/public-matches', (res2) => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        const matches = JSON.parse(body2);
        console.log("GET Response matches[0]:", matches[0]);
      });
    });
  });
});

req.write(data);
req.end();
