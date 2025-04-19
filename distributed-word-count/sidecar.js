const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

// Proxy requests and log them
app.use((req, res, next) => {
  console.log(
    `[Sidecar] Proxying request to ${req.url} at ${new Date().toISOString()}`
  );
  next();
});

app.listen(7000, () => console.log("[Sidecar] Running on port 7000"));
