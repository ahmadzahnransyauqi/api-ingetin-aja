const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test OK' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API Test OK' });
});

app.listen(5001, () => {
  console.log('Test server on port 5001');
});
