const express = require('express');
const app = express();

// Define a route for the root path
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Other routes and server setup...

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
