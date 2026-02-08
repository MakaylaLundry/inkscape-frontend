const express = require("express");
const { sendSuccess } = require("../utils/apiResponse");

const router = express.Router();

router.get("/health", (_req, res) => {
  return sendSuccess(res, {
    status: "ok"
  });
});

module.exports = router;
