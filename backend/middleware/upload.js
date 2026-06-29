const path = require('path');
const multer = require('multer');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createUpload = (folder, prefix = 'file', allowDocs = false, allowCSV = false) => {
  const dest = path.join(__dirname, `../uploads/${folder}`);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}-${unique}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const imageExt = /jpeg|jpg|png|gif|webp/;
    const docExt = /pdf|doc|docx|txt/;
    const csvExt = /csv/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const isImage = imageExt.test(ext) && imageExt.test(file.mimetype);
    const isDoc = allowDocs && (docExt.test(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('document'));
    const isCSV = allowCSV && csvExt.test(ext) && (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel');
    if (isImage || isDoc || isCSV) cb(null, true);
    else cb(new Error('File type not allowed'), false);
  };

  return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
};

module.exports = {
  studentUpload: createUpload('students', 'student'),
  homeworkUpload: createUpload('homework', 'homework', true),
  noticeUpload: createUpload('notices', 'notice', true),
  csvUpload: createUpload('temp', 'csv', false, true),
  ticketUpload: createUpload('tickets', 'ticket'),
};
