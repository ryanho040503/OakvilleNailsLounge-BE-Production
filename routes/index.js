const router = require("express").Router();

router.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Use /api endpoints for backend data.",
  });
});

module.exports = router;
