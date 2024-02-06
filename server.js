const express = require('express');
const app = express();

// Define a route for the root path
app.get('/', (req, res) => {
    try {
      // Your route logic here
      res.send('Hello, world!');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// Other routes and server setup...

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
