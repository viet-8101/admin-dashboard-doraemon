import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppWrapper from './App.jsx';
import './index.css';

// Đặt basename khớp với 'base' trong vite.config.js
// Đây là đường dẫn cơ sở của ứng dụng khi được triển khai trên GitHub Pages
const basename = '/admin-dashboard-doraemon/'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}> {/* Thêm thuộc tính basename ở đây */}
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);
