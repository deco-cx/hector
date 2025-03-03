import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { HomePage } from './components/Home/HomePage';
import { AppEditor } from './components/AppCreation/AppEditor';
import { MainLayout } from './components/Layout/MainLayout';
import { WebdrawProvider } from './context/WebdrawContext';
import SDK from './sdk/webdraw-sdk-client';
import { theme } from './theme';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <WebdrawProvider sdk={SDK}>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/edit/:appName" element={<MainLayout><AppEditor /></MainLayout>} />
          </Routes>
        </Router>
      </WebdrawProvider>
    </ConfigProvider>
  );
}

export default App;
