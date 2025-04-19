module.exports = {
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  coordinatorPort: 4000,
  proposerPorts: [4001, 4002, 4003], // Add more ports for additional proposers
  acceptorPorts: [5001, 5002, 5003], // Add more ports for additional acceptors
  learnerPort: 6060,
  sidecarPortOffset: 1000, // Sidecar proxy runs on proposer/acceptor/learner port + offset
};
