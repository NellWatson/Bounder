
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:page', (req, res) => {
  const page = req.params.page;
  const pagePath = path.join(__dirname, page + '.html');
  if (require('fs').existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    res.sendFile(path.join(__dirname, '404.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
  