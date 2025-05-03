import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainPage from './pages/MainPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2D3E50', // Deep navy blue - professional, security-focused
      light: '#34495E',
      dark: '#1A2530',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E74C3C', // Alert red for warnings
      light: '#F1948A',
      dark: '#B03A2E',
    },
    safe: {
      main: '#2ECC71', // Green for safe results
      light: '#82E0AA',
      dark: '#239B56',
      contrastText: '#FFFFFF',
    },
    suspicious: {
      main: '#F39C12', // Orange for suspicious results
      light: '#F8C471',
      dark: '#D68910',
      contrastText: '#FFFFFF',
    },
    scam: {
      main: '#E74C3C', // Red for scam results
      light: '#F1948A',
      dark: '#B03A2E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#ECF0F1', // Light gray background
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 