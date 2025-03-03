import React from 'react';
import { Layout, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit/');
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {isEditMode && (
          <div className="mb-6">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
              size="large"
            >
              Back to Home
            </Button>
          </div>
        )}
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Hector ©{new Date().getFullYear()} - AI App Builder
      </Footer>
    </Layout>
  );
} 