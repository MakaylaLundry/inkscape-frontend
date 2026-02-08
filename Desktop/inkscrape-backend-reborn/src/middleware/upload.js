const multer = require("multer");
const os = require("os");

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 25
  }
});

module.exports = {
  upload
};
