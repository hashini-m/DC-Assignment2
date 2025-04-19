const express = require("express");
const axios = require("axios");
const fs = require("fs");
const {
  alphabet,
  proposerPorts,
  acceptorPorts,
  learnerPort,
} = require("./config");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

// Assign letter ranges to proposers
function assignLetterRanges() {
  const ranges = [];
  const lettersPerProposer = Math.ceil(alphabet.length / proposerPorts.length);
  for (let i = 0; i < proposerPorts.length; i++) {
    const start = i * lettersPerProposer;
    const end = Math.min((i + 1) * lettersPerProposer, alphabet.length) - 1;
    ranges.push(alphabet.slice(start, end + 1));
  }
  return ranges;
}

// Broadcast cluster information to all nodes
async function broadcastClusterInfo(ranges) {
  console.log("Coordinator: Broadcasting cluster info...");
  const clusterInfo = {
    proposers: proposerPorts,
    acceptors: acceptorPorts,
    learner: learnerPort,
    ranges,
  };

  // Notify proposers
  await Promise.all(
    proposerPorts.map((port) =>
      axios.post(`http://localhost:${port}/clusterInfo`, clusterInfo)
    )
  );

  console.log("Coordinator: Cluster info broadcasted.");
}

// Read document and multicast lines to proposers
async function processDocument(filePath, ranges) {
  console.log(
    `[Coordinator] Processing document at ${new Date().toISOString()}`
  );
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");

  for (const line of lines) {
    console.log(`Coordinator: Sending line to proposers: "${line}"`);
    await Promise.all(
      proposerPorts.map((port) =>
        axios.post(`http://localhost:${port}/processLine`, { line })
      )
    );
  }

  console.log(
    `[Coordinator] Document processing completed at ${new Date().toISOString()}`
  );
}

// Finalize and trigger acceptors to send counts to the learner
async function finalizeCounts() {
  console.log("[Coordinator] Finalizing counts...");
  await Promise.all(
    acceptorPorts.map(async (port) => {
      try {
        await axios.post(`http://localhost:${port}/finalize`);
        console.log(
          `[Coordinator] Finalize request sent to acceptor on port ${port}`
        );
      } catch (error) {
        console.error(
          `[Coordinator] Failed to send finalize request to acceptor on port ${port}: ${error.message}`
        );
      }
    })
  );
}

// Reset all nodes before starting a new process
async function resetCounts() {
  console.log("[Coordinator] Resetting counts...");
  await Promise.all([
    ...acceptorPorts.map(async (port) => {
      try {
        await axios.post(`http://localhost:${port}/reset`);
        console.log(
          `[Coordinator] Reset request sent to acceptor on port ${port}`
        );
      } catch (error) {
        console.error(
          `[Coordinator] Failed to send reset request to acceptor on port ${port}: ${error.message}`
        );
      }
    }),
    axios
      .post(`http://localhost:${learnerPort}/reset`)
      .then(() => {
        console.log("[Coordinator] Reset request sent to learner");
      })
      .catch((error) => {
        console.error(
          `[Coordinator] Failed to send reset request to learner: ${error.message}`
        );
      }),
  ]);
}

// Start the coordinator
app.post("/start", async (req, res) => {
  console.log(
    `[Coordinator] Start request received at ${new Date().toISOString()}`
  );
  const { filePath, paragraph, reset } = req.body;

  // Reset counts if the reset flag is true
  if (reset) {
    console.log("[Coordinator] Reset flag is true. Resetting counts...");
    await resetCounts();
  } else {
    console.log(
      "[Coordinator] Reset flag is false. Continuing from previous state..."
    );
  }

  let lines = [];
  if (filePath) {
    console.log(`[Coordinator] Processing file: ${filePath}`);
    lines = fs.readFileSync(filePath, "utf-8").split("\n");
  } else if (paragraph) {
    console.log(`[Coordinator] Processing paragraph`);
    lines = paragraph.split("\n"); // Split paragraph into lines
  } else {
    return res
      .status(400)
      .send("Coordinator: Either filePath or paragraph must be provided.");
  }

  const ranges = assignLetterRanges();
  console.log("Coordinator: Assigned letter ranges:", ranges);

  await broadcastClusterInfo(ranges);
  for (const line of lines) {
    console.log(`Coordinator: Sending line to proposers: "${line}"`);
    await Promise.all(
      proposerPorts.map((port) =>
        axios.post(`http://localhost:${port}/processLine`, { line })
      )
    );
  }

  console.log(
    `[Coordinator] Document processing completed at ${new Date().toISOString()}`
  );
  await finalizeCounts(); // Trigger finalization
  res.send("Coordinator: Document processing started.");
});

app.listen(4000, () => console.log("Coordinator running on port 4000"));
