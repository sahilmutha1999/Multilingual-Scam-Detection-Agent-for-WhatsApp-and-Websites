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
  Chip,
  Divider,
  useTheme,
  Stack,
  Zoom,
  LinearProgress,
  Avatar,
  Tooltip,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LanguageIcon from '@mui/icons-material/Language';
import LinkIcon from '@mui/icons-material/Link';
import MessageIcon from '@mui/icons-material/Message';
import MicIcon from '@mui/icons-material/Mic';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Language mapping for display
const LANGUAGE_DISPLAY = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian'
};

// Language flag icons (ISO codes)
const LANGUAGE_FLAGS = {
  'en': '🇺🇸',
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'zh': '🇨🇳',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
  'ru': '🇷🇺'
};

function MainPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioWarning, setAudioWarning] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResult(null);
    setError(null);
    setAudioWarning(null);
    setAudioFile(null);
    setAudioDuration(0);
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

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setAudioFile(null);
      setAudioDuration(0);
      setAudioWarning(null);
      return;
    }

    const audioElement = document.createElement('audio');
    audioElement.src = URL.createObjectURL(file);
    
    setAudioWarning(null);

    audioElement.addEventListener('loadedmetadata', () => {
      const duration = audioElement.duration;
      setAudioDuration(duration);
      
      if (duration > 60) {
        setAudioWarning("Audio exceeds 1 minute limit. Please upload a shorter recording (under 60 seconds).");
        setAudioFile(null);
      } else {
        setAudioFile(file);
        setAudioWarning(null);
      }
      
      URL.revokeObjectURL(audioElement.src);
    });
    
    audioElement.addEventListener('error', () => {
      setAudioWarning("Unable to validate audio file. Please ensure it's a valid audio format.");
      setAudioFile(null);
      URL.revokeObjectURL(audioElement.src);
    });
  };

  const handleAudioCheck = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (audioDuration > 60) {
      setError('Audio file must be less than 1 minute long');
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

  // Handle playing the audio from base64
  const handlePlayAudio = () => {
    if (result && result.audio_base64) {
      const audioSrc = `data:audio/mp3;base64,${result.audio_base64}`;
      const audioEl = new Audio(audioSrc);
      audioEl.play();
    }
  };

  // Get risk-related visual elements
  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return <ShieldIcon />;
      case 'suspicious':
        return <WarningIcon />;
      case 'scam':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return 'safe';
      case 'suspicious':
        return 'suspicious';
      case 'scam':
        return 'scam';
      default:
        return 'primary';
    }
  };

  const tabIcons = [
    <LinkIcon key="url" />,
    <MessageIcon key="message" />,
    <MicIcon key="voice" />
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #ECF0F1, #D6EAF8)',
      pt: 4, 
      pb: 6
    }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: theme.palette.primary.main,
                mb: 2
              }}
            >
              <SecurityIcon fontSize="large" />
            </Avatar>
          </Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}
          >
            Multilingual Scam Detection
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}
          >
            Analyze messages, URLs and voice recordings for potential scams in multiple languages
          </Typography>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: '64px',
                fontWeight: 500,
              },
              mb: 3
            }}
          >
            <Tab icon={tabIcons[0]} label="URL Check" iconPosition="start" />
            <Tab icon={tabIcons[1]} label="Message Check" iconPosition="start" />
            <Tab icon={tabIcons[2]} label="Voice Check" iconPosition="start" />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ px: { xs: 1, md: 2 } }}>
            {activeTab === 0 && (
              <Zoom in={activeTab === 0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enter URL to Check"
                      variant="outlined"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      InputProps={{
                        startAdornment: (
                          <LinkIcon color="action" sx={{ mr: 1 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUrlCheck}
                      disabled={loading || !url}
                      fullWidth
                      size="large"
                      sx={{ mt: 1 }}
                      startIcon={<SecurityIcon />}
                    >
                      Analyze URL for Scams
                    </Button>
                  </Grid>
                </Grid>
              </Zoom>
            )}

            {activeTab === 1 && (
              <Zoom in={activeTab === 1}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enter Message to Check"
                      variant="outlined"
                      multiline
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Paste the suspicious message here..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleMessageCheck}
                      disabled={loading || !message}
                      fullWidth
                      size="large"
                      sx={{ mt: 1 }}
                      startIcon={<SecurityIcon />}
                    >
                      Analyze Message for Scams
                    </Button>
                  </Grid>
                </Grid>
              </Zoom>
            )}

            {activeTab === 2 && (
              <Zoom in={activeTab === 2}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        border: '2px dashed rgba(0, 0, 0, 0.12)',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.01)',
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Voice Sample Analysis
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload an audio file under 1 minute long to detect potential scams
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        component="label"
                        color="primary"
                        startIcon={<MicIcon />}
                        size="large"
                      >
                        Upload Audio File
                        <input
                          type="file"
                          hidden
                          accept="audio/*"
                          onChange={handleAudioFileChange}
                        />
                      </Button>
                      
                      {audioFile ? (
                        <Box sx={{ mt: 2 }}>
                          <Chip 
                            label={`${audioFile.name} (${audioDuration.toFixed(1)}s)`}
                            variant="outlined" 
                            color="primary"
                            icon={<MicIcon />}
                            sx={{ 
                              maxWidth: '100%', 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Supported formats: MP3, WAV, M4A
                        </Typography>
                      )}
                      
                      {audioWarning && (
                        <Alert 
                          severity="warning" 
                          sx={{ mt: 2, mx: 'auto', maxWidth: '100%' }}
                          variant="outlined"
                        >
                          {audioWarning}
                        </Alert>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAudioCheck}
                      disabled={loading || !audioFile || audioDuration > 60}
                      fullWidth
                      size="large"
                      sx={{ mt: 1 }}
                      startIcon={<SecurityIcon />}
                    >
                      Analyze Audio for Scams
                    </Button>
                    
                    {audioDuration > 0 && audioDuration <= 60 && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(audioDuration / 60) * 100}
                          color={audioDuration <= 60 ? "primary" : "error"}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            0s
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={audioDuration <= 60 ? 'normal' : 'bold'}>
                            {audioDuration.toFixed(1)}s
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            60s (max)
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Zoom>
            )}
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Analyzing content...
            </Typography>
            <LinearProgress 
              sx={{ width: '100%', mt: 2, height: 8, borderRadius: 4 }} 
              color="primary"
            />
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            variant="filled"
          >
            {error}
          </Alert>
        )}

        {result && (
          <Zoom in={Boolean(result)}>
            <Card 
              elevation={4} 
              sx={{ 
                mb: 3, 
                overflow: 'hidden',
                border: `1px solid ${theme.palette[getRiskColor(result.risk_level)].light}`,
              }}
            >
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: theme.palette[getRiskColor(result.risk_level)].main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette[getRiskColor(result.risk_level)].dark }}>
                  {getRiskIcon(result.risk_level)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {result.risk_level === 'safe' ? 'Content is Safe' : 
                      result.risk_level === 'suspicious' ? 'Potentially Suspicious Content' : 
                      'Likely Scam Detected'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {result.risk_level === 'safe' ? 'No harmful content detected' : 
                      result.risk_level === 'suspicious' ? 'Exercise caution with this content' : 
                      'High risk of fraudulent activity'}
                  </Typography>
                </Box>
              </Box>
              
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                      {result.explanation}
                    </Typography>

                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          icon={<LanguageIcon />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{LANGUAGE_FLAGS[result.language] || ''}</span>
                              <span>{LANGUAGE_DISPLAY[result.language] || result.language.toUpperCase()}</span>
                            </Box>
                          }
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      
                      {result.audio_base64 && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<VolumeUpIcon />}
                            onClick={handlePlayAudio}
                            size="small"
                          >
                            Listen to Detection Result
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom align="center">
                        Confidence Score
                      </Typography>
                      
                      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress 
                            variant="determinate" 
                            value={result.confidence * 100} 
                            size={120}
                            thickness={5}
                            color={getRiskColor(result.risk_level)}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="h5"
                              component="div"
                              color="text.primary"
                              fontWeight="bold"
                            >
                              {`${Math.round(result.confidence * 100)}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Tooltip title="This score reflects our confidence in the risk assessment">
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary" align="center">
                            Confidence Level
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Zoom>
        )}
        
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Powered by Advanced Multilingual Scam Detection Technology • Stay Safe Online
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default MainPage; 