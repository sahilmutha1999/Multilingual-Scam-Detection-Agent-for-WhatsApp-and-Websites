import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Language mapping for display
const LANGUAGE_DISPLAY = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French'
};

function MainPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audio, setAudio] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResult(null);
    setError(null);
  };

  const handleUrlCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/api/check-url`, { url });
      setResult(response.data);
    } catch (err) {
      if (typeof err.response?.data?.detail === 'object') {
        setError(JSON.stringify(err.response.data.detail) || 'An error occurred');
      } else {
        setError(err.response?.data?.detail || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/api/check-message`, { text: message });
      setResult(response.data);
    } catch (err) {
      if (typeof err.response?.data?.detail === 'object') {
        setError(JSON.stringify(err.response.data.detail) || 'An error occurred');
      } else {
        setError(err.response?.data?.detail || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAudioCheck = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', audioFile);
      const response = await axios.post(`${API_BASE_URL}/api/check-voice`, formData);
      setResult(response.data);
    } catch (err) {
      if (typeof err.response?.data?.detail === 'object') {
        setError(JSON.stringify(err.response.data.detail) || 'An error occurred');
      } else {
        setError(err.response?.data?.detail || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return 'success';
      case 'suspicious':
        return 'warning';
      case 'scam':
        return 'error';
      default:
        return 'info';
    }
  };

  // Handle playing the audio from base64
  const handlePlayAudio = () => {
    if (result && result.audio_base64) {
      const audioSrc = `data:audio/mp3;base64,${result.audio_base64}`;
      const audioEl = new Audio(audioSrc);
      audioEl.play();
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Multilingual Scam Detection
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="URL Check" />
            <Tab label="Message Check" />
            <Tab label="Voice Check" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Enter URL"
                    variant="outlined"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUrlCheck}
                    disabled={loading || !url}
                  >
                    Check URL
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Enter Message"
                    variant="outlined"
                    multiline
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleMessageCheck}
                    disabled={loading || !message}
                  >
                    Check Message
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                    fullWidth
                  >
                    Upload Audio File
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files[0])}
                    />
                  </Button>
                  {audioFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {audioFile.name}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAudioCheck}
                    disabled={loading || !audioFile}
                  >
                    Check Audio
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detection Result
              </Typography>
              <Alert severity={getRiskColor(result.risk_level)} sx={{ mb: 2 }}>
                Risk Level: {result.risk_level.toUpperCase()}
              </Alert>
              <Typography variant="body1" gutterBottom>
                Confidence: {(result.confidence * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body1" gutterBottom>
                Language: {LANGUAGE_DISPLAY[result.language] || result.language.toUpperCase()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Explanation: {result.explanation}
              </Typography>
              {result.audio_base64 && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    color="primary" 
                    onClick={handlePlayAudio}
                    aria-label="play detection audio"
                  >
                    <VolumeUpIcon />
                  </IconButton>
                  <Typography variant="body2">
                    Listen to detection result
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}

export default MainPage; 