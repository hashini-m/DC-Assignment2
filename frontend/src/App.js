// src/App.js

import { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

function App() {
  const [paragraph, setParagraph] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/start", {
        paragraph,
        reset: true,
      });

      if (
        res.data &&
        res.data === "Coordinator: Document processing started."
      ) {
        // Wait for a small delay before fetching results (processing may take a tiny moment)
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay

        const result = await axios.get("http://localhost:6060/result");
        console.log("Result:", result.data);

        setResponse(result.data); // <-- Now set the result as the response!
      } else {
        setResponse(res.data); // Coordinator sent unexpected response
      }
    } catch (error) {
      setResponse("Error submitting paragraph: " + error.message);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Distributed Word Counter
      </Typography>

      <Box component="form" noValidate autoComplete="off" sx={{ mb: 4 }}>
        <TextField
          label="Paste your paragraph here"
          multiline
          fullWidth
          rows={6}
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
          variant="outlined"
        />
      </Box>

      <Box textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || !paragraph.trim()}
          size="large"
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Submit Paragraph"
          )}
        </Button>
      </Box>

      {response && (
        <Paper elevation={3} sx={{ mt: 6, p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Server Response:
          </Typography>
          <Typography variant="body1" component="pre">
            {JSON.stringify(response, null, 2)}
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default App;
