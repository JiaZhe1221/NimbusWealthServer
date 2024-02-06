const express = require('express');
const app = express();


app.get("", (req, res) => {
    res.send('Hello, this is your root route!');
});

// Other routes can be defined here...

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
