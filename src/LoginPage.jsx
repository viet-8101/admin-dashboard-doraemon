// src/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!BACKEND_URL) {
      setError("Lỗi: Không tìm thấy URL Backend trong biến môi trường.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/admin/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem('adminToken', token);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        // Backend trả về success: false nhưng có message
        setError(response.data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      // Xử lý lỗi cụ thể từ backend, bao gồm lỗi ban IP
      if (err.response) {
        if (err.response.status === 403) {
          // Kiểm tra nếu lỗi là do bị chặn (từ securityMiddleware nếu nó được áp dụng)
          if (err.response.data && err.response.data.error && err.response.data.error.includes('chặn')) {
            setError(err.response.data.error); // Hiển thị thông báo ban từ backend
          } else {
            setError(err.response.data.message || 'Lỗi: Không có quyền truy cập.');
          }
        } else if (err.response.status === 401) {
          // Đã sửa để đọc từ err.response.data.error
          setError(err.response.data.error || 'Tên đăng nhập hoặc mật khẩu không đúng.');
        } else {
          setError(`Lỗi ${err.response.status}: ${err.response.data.message || 'Đã có lỗi xảy ra.'}`);
        }
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc URL Backend.');
      } else {
        setError('Lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Đăng nhập Dashboard Admin</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Tên đăng nhập:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
