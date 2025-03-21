import multer from "multer";

// Add file type validation
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  console.log(`File ${file.fieldname} mimetype:`, file.mimetype);
};

const upload1 = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  storage,
  fileFilter,
});

export default upload1;
