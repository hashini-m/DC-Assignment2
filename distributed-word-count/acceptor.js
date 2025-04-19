const express = require("express");
const axios = require("axios");
const { learnerPort } = require("./config");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

let highestProposalNumber = 0; // Track the highest proposal number seen

let finalizedProposals = []; // Collect { id, counts, words }

let acceptedCounts = {}; // { A: 5 }
let acceptedWords = {}; // { A: ['apple', 'aid'] }

// Utility function to log with timestamp
function logStep(stepName, message) {
  console.log(`[${new Date().toISOString()}] [${stepName}] ${message}`);
}

// Simulate the prepare phase of Paxos
app.post("/prepare", (req, res) => {
  const { proposalNumber, count } = req.body;
  logStep(
    "Prepare Phase",
    `Received prepare phase with proposal number ${proposalNumber} and count ${count}`
  );
  if (proposalNumber > highestProposalNumber) {
    highestProposalNumber = proposalNumber; // Update highest proposal number
    logStep(
      "Prepare Phase",
      `Prepare phase accepted with proposal number ${proposalNumber}`
    );
    res.send("Acceptor: Prepare phase accepted");
  } else {
    logStep(
      "Prepare Phase",
      `Prepare phase rejected (proposal number too low)`
    );
    res.status(400).send("Acceptor: Prepare phase rejected");
  }
});

// Simulate the accept phase of Paxos

app.post("/accept", (req, res) => {
  const { proposalId, proposalNumber, counts, words } = req.body;

  if (proposalNumber >= highestProposalNumber) {
    highestProposalNumber = proposalNumber;

    // Store this proposal separately
    finalizedProposals.push({ proposalId, counts, words });
    res.send("Acceptor: Counts accepted");
  } else {
    res.status(400).send("Acceptor: Counts rejected");
  }
});

// Reset counts for each new `/start` call

app.post("/reset", (req, res) => {
  acceptedCounts = {};
  acceptedWords = {};
  logStep("Reset", "Accepted counts and words reset.");
  res.send("Acceptor: Counts reset.");
});

// Send final counts to learner

app.post("/finalize", async (req, res) => {
  for (const { proposalId, counts, words } of finalizedProposals) {
    await axios.post(`http://localhost:${learnerPort}/aggregate`, {
      proposalId,
      counts,
      words,
    });
  }
  finalizedProposals = []; // Clear proposals
  res.send("Acceptor: Final counts sent.");
});

app.listen(5001 + parseInt(process.argv[2]), () =>
  logStep(
    "Startup",
    `Acceptor running on port ${5001 + parseInt(process.argv[2])}`
  )
);
