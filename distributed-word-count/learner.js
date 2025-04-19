const express = require("express");
const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

let finalCounts = {}; // { A: 5 }
let finalWords = {}; // { A: ['apple', 'aid'] }

let receivedProposalIds = new Set();

// Utility function to log with timestamp
function logStep(stepName, message) {
  console.log(`[${new Date().toISOString()}] [${stepName}] ${message}`);
}

// Reset counts for each new `/start` call

app.post("/reset", (req, res) => {
  finalCounts = {};
  finalWords = {};
  receivedProposalIds.clear();
  logStep("Reset", "Final counts and words reset.");
  res.send("Learner: Counts reset.");
});

// Aggregate counts from acceptors

app.post("/aggregate", (req, res) => {
  const { proposalId, counts, words } = req.body;

  if (receivedProposalIds.has(proposalId)) {
    logStep("Aggregate", `Duplicate proposal ${proposalId} ignored.`);
    return res.send("Learner: Duplicate proposal ignored.");
  }

  receivedProposalIds.add(proposalId);

  for (const [letter, count] of Object.entries(counts)) {
    finalCounts[letter] = (finalCounts[letter] || 0) + count;
  }

  for (const [letter, wordCounts] of Object.entries(words)) {
    if (!finalWords[letter]) {
      finalWords[letter] = {};
    }
    for (const [word, count] of Object.entries(wordCounts)) {
      finalWords[letter][word] = (finalWords[letter][word] || 0) + count;
    }
  }

  res.send("Learner: Counts and words aggregated.");
});

// Display final result

app.get("/result", (req, res) => {
  const sortedResult = Object.keys(finalCounts)
    .sort()
    .reduce((acc, letter) => {
      const wordList = finalWords[letter]
        ? Object.keys(finalWords[letter])
            .sort()
            .flatMap((word) => Array(finalWords[letter][word]).fill(word))
        : [];

      acc[letter] = {
        count: wordList.length,
        words: wordList,
      };
      return acc;
    }, {});

  res.json(sortedResult);
});

app.listen(6060, () => logStep("Startup", "Learner running on port 6060"));
