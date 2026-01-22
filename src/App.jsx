import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import router from './routes';
import 'antd/dist/reset.css';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#f5741f',
          borderRadius: 6,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
