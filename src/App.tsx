import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { HomePage } from './components/Home/HomePage';
import { AppCreationWizard } from './components/AppCreation/AppCreationWizard';
import { WebdrawProvider } from './providers/WebdrawProvider';
import { MockWebdrawSDK } from './mocks/webdraw-sdk';
import { theme } from './theme';

// Initialize the mock SDK
const mockSDK = new MockWebdrawSDK();

export function App() {
  return (
    <WebdrawProvider sdk={mockSDK}>
      <ConfigProvider theme={theme}>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<AppCreationWizard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </WebdrawProvider>
  );
}
