import { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#7B2CBF',
    fontFamily: "'Merriweather', serif",
    borderRadius: 6,
    colorBgContainer: '#ffffff',
  },
  components: {
    Layout: {
      bodyBg: '#f0f2f5',
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    },
    Button: {
      colorPrimary: '#7B2CBF',
      algorithm: true,
    },
  },
}; 