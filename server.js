const express = require('express');
const app = express();

// Define a route for the root path
app.get('/', (req, res) => {
    res.send('Hello, this is your root route!');
});

// Other routes can be defined here...

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
