const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

const router = express.Router();

// Ensure the 'converted_files' directory exists
if (!fs.existsSync('./converted_files')) {
  fs.mkdirSync('./converted_files');
}

// Setup file storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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

const upload = multer({ storage });

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

// Route to upload and convert Word files (multiple files)
router.post('/', upload.array('file'), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).send('No files uploaded');
    }

    // Iterate over each uploaded file and process it
    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const pdfPath = `./converted_files/${Date.now()}_${file.originalname}.pdf`;

      if (fileExtension === '.docx') {
        // Convert .docx to HTML using Mammoth
        const result = await mammoth.convertToHtml({ path: file.path });
        const htmlContent = result.value;

        // Use Puppeteer to create a PDF from the HTML
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(htmlContent);
        await page.pdf({ path: pdfPath, format: 'A4' });

        await browser.close();

        // Send the converted PDF as response
        res.download(pdfPath, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          }
          // Clean up files after download
          removeFile(file.path);
          removeFile(pdfPath);
        });
      } else if (fileExtension === '.doc') {
        // Handle .doc conversion logic (if required)
      } else {
        return res.status(400).send('Unsupported file format. Only .doc and .docx are allowed.');
      }
    }
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send(`Error processing file: ${error.message}`);
  }
});

module.exports = router;
