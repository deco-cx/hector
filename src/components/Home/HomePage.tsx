import React from 'react';
import { Typography, Row, Col, Card, Button } from 'antd';
import { PlusOutlined, AppstoreOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      <Title>Welcome to Hector</Title>
      <Paragraph>
        Build AI-powered applications without writing code. Create forms, workflows,
        and interactive experiences powered by artificial intelligence.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/create')}>
            <div style={{ textAlign: 'center' }}>
              <PlusOutlined style={{ fontSize: 24, marginBottom: 16 }} />
              <Title level={4}>Create New App</Title>
              <Paragraph>
                Start building your AI-powered application with our step-by-step wizard.
              </Paragraph>
              <Button type="primary" icon={<PlusOutlined />}>
                Create App
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card hoverable>
            <div style={{ textAlign: 'center' }}>
              <AppstoreOutlined style={{ fontSize: 24, marginBottom: 16 }} />
              <Title level={4}>My Apps</Title>
              <Paragraph>
                View and manage your existing applications.
              </Paragraph>
              <Button icon={<AppstoreOutlined />}>View Apps</Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card hoverable>
            <div style={{ textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: 24, marginBottom: 16 }} />
              <Title level={4}>Documentation</Title>
              <Paragraph>
                Learn how to make the most of Hector's features.
              </Paragraph>
              <Button icon={<BookOutlined />}>Learn More</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 