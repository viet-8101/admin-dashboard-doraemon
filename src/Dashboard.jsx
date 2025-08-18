// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Định nghĩa giá trị cho ban vĩnh viễn, khớp với backend
const PERMANENT_BAN_VALUE = Number.MAX_SAFE_INTEGER;

// Hàm kiểm tra token JWT hợp lệ
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (e) {
    return false;
  }
};

/**
 * Component chính của ứng dụng.
 * Quản lý trạng thái đăng nhập và định tuyến.
 */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(isTokenValid(localStorage.getItem('adminToken')));

  // Cấu hình axios để tự động thêm header Authorization cho mọi request
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Cấu hình axios để tự động xử lý lỗi 401/403
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setIsLoggedIn(false);
        localStorage.removeItem('adminToken');
        console.error('Lỗi xác thực: Token không hợp lệ hoặc đã hết hạn.');
      }
      return Promise.reject(error);
    }
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Dashboard setIsLoggedIn={setIsLoggedIn} /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard setIsLoggedIn={setIsLoggedIn} /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Component Login để xử lý đăng nhập và xác thực 2FA.
 *
 * @param {object} props - Các thuộc tính được truyền vào.
 * @param {Function} props.setIsLoggedIn - Hàm cập nhật trạng thái đăng nhập.
 */
const Login = ({ setIsLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTfaStep, setIsTfaStep] = useState(false);
  const [tfaToken, setTfaToken] = useState('');
  const navigate = useNavigate();

  // Fix: Cung cấp giá trị mặc định cho biến môi trường để tránh lỗi trong môi trường không hỗ trợ import.meta.env
  const BACKEND_URL = typeof import.meta.env.VITE_BACKEND_URL !== 'undefined' ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:3000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/admin/login`, { username, password });
      setMessage(res.data.message);
      setTfaToken(res.data.tfaToken);
      setIsTfaStep(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đã có lỗi xảy ra.');
    }
  };

  const handleVerifyTfa = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/admin/verify-tfa`, { tfaToken, tfaCode });
      localStorage.setItem('adminToken', res.data.adminToken);
      setIsLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Đã có lỗi xảy ra.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Đăng nhập Admin</h2>
        {message && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4" role="alert">{message}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
        
        {!isTfaStep ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="username"
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Mật khẩu
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="password"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                type="submit"
              >
                Đăng nhập
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyTfa}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tfaCode">
                Mã xác thực
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="tfaCode"
                type="text"
                placeholder="Nhập mã 2FA"
                value={tfaCode}
                onChange={(e) => setTfaCode(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                type="submit"
              >
                Xác thực
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * Component Dashboard hiển thị dữ liệu quản trị và các chức năng.
 *
 * @param {object} props - Các thuộc tính được truyền vào.
 * @param {Function} props.setIsLoggedIn - Hàm cập nhật trạng thái đăng nhập.
 */
const Dashboard = ({ setIsLoggedIn }) => {
  const [backendStatus, setBackendStatus] = useState("Đang kết nối...");
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [banValue, setBanValue] = useState('');
  const [banType, setBanType] = useState('ip');
  const [banDuration, setBanDuration] = useState('12');
  const [banMessage, setBanMessage] = useState('');
  const navigate = useNavigate();

  // Fix: Cung cấp giá trị mặc định cho biến môi trường để tránh lỗi trong môi trường không hỗ trợ import.meta.env
  const BACKEND_URL = typeof import.meta.env.VITE_BACKEND_URL !== 'undefined' ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:3000';

  // Hàm xử lý lỗi API
  const handleApiError = (err) => {
    console.error("Lỗi API:", err);
    if (err.response) {
      if (err.response.status === 403 || err.response.status === 401) {
        if (err.response.data && err.response.data.error === "Token không hợp lệ hoặc đã hết hạn.") {
          setError("Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError(err.response.data.error || "Lỗi xác thực.");
        }
        setIsLoggedIn(false);
        localStorage.removeItem('adminToken');
        navigate('/login');
      } else {
        setError(err.response.data.error || 'Đã có lỗi xảy ra.');
      }
    } else {
      setError('Không thể kết nối đến máy chủ.');
    }
  };

  // Hàm lấy dữ liệu dashboard từ backend
  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/dashboard-data`);
      setDashboardData(res.data);
      setError(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  // useEffect để lấy dữ liệu khi component được mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleBan = async () => {
    setBanMessage('');
    if (!banValue) {
      setBanMessage('Vui lòng nhập giá trị để ban.');
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/admin/ban`, {
        type: banType,
        value: banValue,
        duration: banDuration,
      });
      setBanMessage(res.data.message);
      setBanValue('');
      fetchDashboardData();
    } catch (err) {
      setBanMessage(err.response?.data?.error || 'Đã xảy ra lỗi khi ban.');
    }
  };

  const handleUnban = async () => {
    setBanMessage('');
    if (!banValue) {
      setBanMessage('Vui lòng nhập giá trị để unban.');
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/admin/unban`, {
        type: banType,
        value: banValue,
      });
      setBanMessage(res.data.message);
      setBanValue('');
      fetchDashboardData();
    } catch (err) {
      setBanMessage(err.response?.data?.error || 'Đã xảy ra lỗi khi unban.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">
            Bảng điều khiển Admin
          </h1>
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-700 transition duration-200"
          >
            Đăng xuất
          </button>
        </header>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Lỗi!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Thẻ thống kê */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-sm font-semibold uppercase">Tổng yêu cầu</p>
              <p className="text-5xl font-extrabold text-blue-600 mt-2">{dashboardData.total_requests}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-sm font-semibold uppercase">reCAPTCHA thất bại</p>
              <p className="text-5xl font-extrabold text-red-600 mt-2">{dashboardData.total_failed_recaptcha}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-sm font-semibold uppercase">Số IP bị ban</p>
              <p className="text-5xl font-extrabold text-gray-800 mt-2">{Object.keys(dashboardData.banned_ips || {}).length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-sm font-semibold uppercase">Số FP bị ban</p>
              <p className="text-5xl font-extrabold text-gray-800 mt-2">{Object.keys(dashboardData.banned_fingerprints || {}).length}</p>
            </div>

            {/* Bảng điều khiển Ban/Unban */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ban / Unban</h3>
              {banMessage && <div className={`px-4 py-3 rounded mb-4 ${banMessage.includes('thành công') ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-700 border-red-400'}`}>{banMessage}</div>}
              <div className="space-y-4">
                <div>
                  <label htmlFor="banValue" className="block text-gray-700 font-bold mb-2">Giá trị (IP hoặc Fingerprint):</label>
                  <input
                    id="banValue"
                    type="text"
                    value={banValue}
                    onChange={(e) => setBanValue(e.target.value)}
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập IP hoặc Fingerprint"
                  />
                </div>
                <div>
                  <label htmlFor="banType" className="block text-gray-700 font-bold mb-2">Loại:</label>
                  <select
                    id="banType"
                    value={banType}
                    onChange={(e) => setBanType(e.target.value)}
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ip">IP</option>
                    <option value="fingerprint">Fingerprint</option>
                  </select>
                </div>
                 <div>
                  <label htmlFor="banDuration" className="block text-gray-700 font-bold mb-2">Thời gian ban (giờ):</label>
                  <select
                    id="banDuration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ</option>
                    <option value="72">3 ngày</option>
                    <option value="168">7 ngày</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleBan}
                    className="flex-1 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                  >
                    Ban
                  </button>
                  <button
                    onClick={handleUnban}
                    className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                  >
                    Unban
                  </button>
                </div>
              </div>
            </div>

            {/* Bảng IP bị ban */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">IP bị ban</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(dashboardData.banned_ips || {}).map(([ip, expiry]) => (
                      <tr key={ip}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expiry === PERMANENT_BAN_VALUE ? 'Vĩnh viễn' : new Date(expiry).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng Fingerprint bị ban */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Fingerprint bị ban</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fingerprint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(dashboardData.banned_fingerprints || {}).map(([fp, expiry]) => (
                      <tr key={fp}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expiry === PERMANENT_BAN_VALUE ? 'Vĩnh viễn' : new Date(expiry).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Bảng Lượt Đăng nhập Thất bại */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Lượt đăng nhập thất bại</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lần</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lần cuối thất bại</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(dashboardData.failedAttempts || {}).map(([ip, data]) => (
                      <tr key={ip}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(data.lastFailTime).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-8">Đang tải dữ liệu dashboard...</p>
        )}
      </div>
    </div>
  );
};

export default App;
