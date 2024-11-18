const express = require('express');
const cors = require('cors');  // Enable CORS for cross-origin requests
const excelToPdfRouter = require('./routes/excelToPdfRouter');  // Import the router
const wordToPdfRouter = require('./routes/wordToPdfRouter');
const dotenv = require('dotenv');


dotenv.config({ path: "./config/config.env" });

const app = express();

// Define allowed origins
const allowedOrigins = [
  'https://playwithfile.netlify.app',  // Add your deployed React app origin
  'http://localhost:3000'                   // Add localhost for development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Use the excelToPdfRouterunrivaled-kashata-04946b for the "/excel-to-pdf" route
app.use('/excel-to-pdf', excelToPdfRouter);
// Use the wordToPdfRouter for the "/word-to-pdf" route
app.use('/word-to-pdf', wordToPdfRouter);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
