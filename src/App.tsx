import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { WebdrawProvider } from './context/WebdrawContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { HomePage } from './components/Home/HomePage';
import { AppEditor } from './components/AppCreation/AppEditor';
import SDK from './sdk/webdraw-sdk-client';
import './index.css';

function App() {
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
      <WebdrawProvider sdk={SDK}>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/app/:appName" element={<AppEditor />} />
              <Route path="/settings/languages/:appName" element={<AppEditor tab="languages" />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </WebdrawProvider>
    </ConfigProvider>
  );
}

export default App;
