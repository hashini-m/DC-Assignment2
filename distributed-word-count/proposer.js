const express = require("express");
const axios = require("axios");
const { acceptorPorts } = require("./config");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

let assignedRange = "";
let proposalNumber = 0; // Initialize proposal number

const { v4: uuidv4 } = require("uuid"); // npm i uuid at top

// Utility function to log with timestamp
function logStep(stepName, message) {
  console.log(`[${new Date().toISOString()}] [${stepName}] ${message}`);
}

// Receive cluster info
app.post("/clusterInfo", (req, res) => {
  assignedRange = req.body.ranges[parseInt(process.argv[2])];
  logStep("Cluster Info", `Assigned range: ${assignedRange}`);
  res.send("Proposer: Cluster info received.");
});

// Simulate the prepare phase of Paxos

async function prepareProposal(payload) {
  // payload = { counts, words }
  proposalNumber++;
  logStep(
    "Prepare Phase",
    `Sending prepare phase with proposal number ${proposalNumber}...`
  );
  await Promise.all(
    acceptorPorts.map(async (port, i) => {
      try {
        await axios.post(`http://localhost:${port}/prepare`, {
          proposalNumber,
          ...payload,
        });
        logStep("Prepare Phase", `Prepare phase sent to acceptor ${i}`);
      } catch (error) {
        logStep(
          "Prepare Phase",
          `Failed to send prepare phase to acceptor ${i}`
        );
      }
    })
  );
}

// Simulate the accept phase of Paxos

async function acceptProposal(payload) {
  logStep("Accept Phase", "Sending accept phase to acceptors...");
  await Promise.all(
    acceptorPorts.map(async (port, i) => {
      try {
        await axios.post(`http://localhost:${port}/accept`, {
          proposalNumber,
          ...payload,
        });
        logStep("Accept Phase", `Accept phase sent to acceptor ${i}`);
      } catch (error) {
        logStep("Accept Phase", `Failed to send accept phase to acceptor ${i}`);
      }
    })
  );
}

// Process a line and count words

app.post("/processLine", async (req, res) => {
  const line = req.body.line;
  logStep("Process Line", `Received line: "${line}"`);
  const words = line.split(" ").filter((w) => w.length > 0);
  const letterCounts = {}; // { A: 5 }
  const letterWords = {}; // { A: { 'apple': 2, 'aid': 1 } }

  for (const word of words) {
    const firstLetter = word[0].toUpperCase();
    if (assignedRange.includes(firstLetter)) {
      letterCounts[firstLetter] = (letterCounts[firstLetter] || 0) + 1;
      if (!letterWords[firstLetter]) {
        letterWords[firstLetter] = {};
      }
      letterWords[firstLetter][word] =
        (letterWords[firstLetter][word] || 0) + 1;
    }
  }

  logStep(
    "Process Line",
    `Processed line "${line}" with counts ${JSON.stringify(
      letterCounts
    )} and words ${JSON.stringify(letterWords)}`
  );

  const proposalId = `${Date.now()}-${process.argv[2]}-${proposalNumber}`;
  await prepareProposal({
    proposalId,
    counts: letterCounts,
    words: letterWords,
  });
  await acceptProposal({
    proposalId,
    counts: letterCounts,
    words: letterWords,
  });

  res.send("Proposer: Line processed.");
});

app.listen(4001 + parseInt(process.argv[2]), () =>
  logStep(
    "Startup",
    `Proposer running on port ${4001 + parseInt(process.argv[2])}`
  )
);
