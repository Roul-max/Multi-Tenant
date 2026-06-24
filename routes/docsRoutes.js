const express = require("express");
const swaggerDocument = require("../docs/swagger.json");

const router = express.Router();

router.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

router.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NotesFlow API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: "/api/docs/swagger.json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`);
});

module.exports = router;
