const router = require("express").Router();

router.get("/", (_request, response) => {
  response.json({
    success: true,
    users: [],
  });
});

module.exports = router;
