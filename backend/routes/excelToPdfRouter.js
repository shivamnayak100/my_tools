// excelToPdfRouter.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');  // For handling .xls files
const ExcelJS = require('exceljs');  // For handling .xlsx files
const PDFDocument = require('pdfkit');

const router = express.Router();

// Setup file storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the 'uploads' directory exists
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage });  // Middleware for handling file uploads

// Helper function to remove files
const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file: ${filePath}`, err);
    } else {
      console.log(`Successfully deleted file: ${filePath}`);
    }
  });
};

// Route to upload and convert Excel files
router.post('/', upload.array('file', 10), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Ensure the 'converted_files' directory exists
    if (!fs.existsSync('./converted_files')) {
      fs.mkdirSync('./converted_files');
    }

    for (const file of files) {
      const fileExtension = path.extname(file.originalname);  // Get file extension (.xls or .xlsx)
      const filePath = file.path;  // Path to uploaded file
      const pdfPath = './converted_files/' + Date.now() + '.pdf';  // Output PDF path

      console.log(`Processing file: ${file.originalname} at ${filePath}`);

      let worksheet;

      // Handle .xlsx files using ExcelJS
      if (fileExtension === '.xlsx') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet(1);  // Access the first worksheet

        if (!worksheet) {
          throw new Error('Worksheet not found in .xlsx file');
        }

        const doc = new PDFDocument();
        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);

        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell((cell, colNumber) => {
            doc.text(cell.text, { continued: colNumber !== row.cellCount });
          });
          doc.moveDown();
        });

        doc.end();

        pdfStream.on('finish', () => {
          res.download(pdfPath, (err) => {
            removeFile(filePath);
            removeFile(pdfPath);
          });
        });

      } else if (fileExtension === '.xls') {
        // Handle .xls files using XLSX
        const workbook = XLSX.readFile(filePath);  // Read .xls file
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        const jsonSheet = XLSX.utils.sheet_to_json(sheet, { header: 1 });  // Convert .xls to JSON array

        const doc = new PDFDocument();
        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);

        jsonSheet.forEach((row) => {
          row.forEach((cell, index) => {
            doc.text(cell.toString(), { continued: index < row.length - 1 });
          });
          doc.moveDown();
        });

        doc.end();

        pdfStream.on('finish', () => {
          res.download(pdfPath, (err) => {
            removeFile(filePath);
            removeFile(pdfPath);
          });
        });

      } else {
        throw new Error('Unsupported file format. Please upload .xls or .xlsx files.');
      }
    }
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).send(`Error processing files: ${error.message}`);
  }
});

module.exports = router;
