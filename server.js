const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use the dynamic port assigned by Heroku or default to 3000

// Define a route for the root path
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});