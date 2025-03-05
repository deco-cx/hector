import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, Spin, Alert } from 'antd';
import { HectorProvider } from './context/HectorContext';
import { HomePage } from './components/Home/HomePage';
import { AppEditor } from './components/AppCreation/AppEditor';
import './index.css';

function App() {
  const [initialized, setInitialized] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Show loading while initializing
  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        {error ? (
          <Alert
            message="Initialization Error"
            description={error.message}
            type="error"
            showIcon
          />
        ) : (
          <Spin tip="Initializing..." size="large" />
        )}
      </div>
    );
  }
  
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#7c3aed',
          borderRadius: 6,
          fontFamily: "'Merriweather', serif",
        },
      }}
    >
      <HectorProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app/:appName" element={<AppEditor />} />
            <Route path="/settings/languages/:appName" element={<AppEditor tab="languages" />} />
          </Routes>
        </Router>
      </HectorProvider>
    </ConfigProvider>
  );
}

export default App;
