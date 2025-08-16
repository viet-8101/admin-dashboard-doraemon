import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ban, CheckCircle, Loader2, LayoutDashboard, Shield, Fingerprint, LogOut, X, AlertTriangle } from "lucide-react";

const API_BASE_URL = 'https://doraemon-backend.onrender.com';
const PERMANENT_BAN_VALUE = 'PERMANENT';

// Component Nút bấm với style chung
const Button = ({ children, className, ...props }) => (
  <button
    className={`flex items-center justify-center px-6 py-3 font-semibold text-white rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Component Input với style chung
const Input = ({ className, ...props }) => (
  <input
    className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${className}`}
    {...props}
  />
);

// Component Select với style chung
const Select = ({ className, ...props }) => (
  <select
    className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${className}`}
    {...props}
  />
);

// Component Loading
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
    <span className="mt-4 text-xl font-medium text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</span>
  </div>
);

// Component Alert Message
const MessageAlert = ({ message, onClose }) => (
  <div className={`flex items-center justify-between p-4 mb-6 rounded-lg text-sm font-medium shadow-md transition-all duration-300 ease-in-out ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
    <span>{message.text}</span>
    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 transition-colors duration-200">
      <X size={16} />
    </button>
  </div>
);

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [stats, setStats] = useState(null);
  const [permanentBannedIps, setPermanentBannedIps] = useState({});
  const [temporaryBannedIps, setTemporaryBannedIps] = useState({});
  const [permanentBannedFingerprints, setPermanentBannedFingerprints] = useState({});
  const [temporaryBannedFingerprints, setTemporaryBannedFingerprints] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ipToBan, setIpToBan] = useState('');
  const [fingerprintToBan, setFingerprintToBan] = useState('');
  const [banType, setBanType] = useState('ip');

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      setToken(response.data.token);
      localStorage.setItem('adminToken', response.data.token);
      showMessage('Đăng nhập thành công!', 'success');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      showMessage(error.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setStats(null);
    setPermanentBannedIps({});
    setTemporaryBannedIps({});
    setPermanentBannedFingerprints({});
    setTemporaryBannedFingerprints({});
    showMessage('Đã đăng xuất thành công.', 'success');
  };

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data.stats);
      setPermanentBannedIps(response.data.permanent_banned_ips || {});
      setTemporaryBannedIps(response.data.temporary_banned_ips || {});
      setPermanentBannedFingerprints(response.data.permanent_banned_fingerprints || {});
      setTemporaryBannedFingerprints(response.data.temporary_banned_fingerprints || {});
      showMessage('Tải dữ liệu thành công!', 'success');
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      showMessage(error.response?.data?.error || 'Không thể tải dữ liệu. Vui lòng đăng nhập lại.', 'error');
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (type, value) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/unban`, { type, value }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showMessage(response.data.message, 'success');
      fetchStats();
    } catch (error) {
      console.error('Lỗi khi gỡ cấm:', error);
      showMessage(error.response?.data?.error || 'Gỡ cấm thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (e) => {
    e.preventDefault();
    setLoading(true);
    const value = banType === 'ip' ? ipToBan : fingerprintToBan;

    if (!value) {
      showMessage(`Vui lòng nhập ${banType === 'ip' ? 'địa chỉ IP' : 'ID Fingerprint'} để cấm.`, 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/ban`, { type: banType, value, reason: PERMANENT_BAN_VALUE }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showMessage(response.data.message, 'success');
      fetchStats();
      setIpToBan('');
      setFingerprintToBan('');
    } catch (error) {
      console.error('Lỗi khi cấm:', error);
      showMessage(error.response?.data?.error || 'Cấm thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans text-gray-900 dark:text-white">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-4xl font-extrabold text-center mb-8 text-gray-900 dark:text-white">Đăng nhập Admin</h2>
          {message && <MessageAlert message={message} onClose={() => setMessage(null)} />}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="username">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="password">
                Mật khẩu
              </label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold flex items-center text-gray-900 dark:text-white">
            <LayoutDashboard className="mr-3 text-blue-600" size={32} />
            Admin Dashboard
          </h1>
          <Button
            onClick={handleLogout}
            className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700"
          >
            <LogOut size={20} className="mr-2" />
            Đăng xuất
          </Button>
        </div>

        {message && <MessageAlert message={message} onClose={() => setMessage(null)} />}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6">Thống kê chung</h2>
              {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center transition-transform duration-200 hover:scale-[1.02]">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                      <LayoutDashboard className="text-blue-600 dark:text-blue-400" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số yêu cầu</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_requests}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center transition-transform duration-200 hover:scale-[1.02]">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mr-4">
                      <Ban className="text-red-600 dark:text-red-400" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tổng reCAPTCHA thất bại</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_failed_recaptcha}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center transition-transform duration-200 hover:scale-[1.02]">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full mr-4">
                      <Shield className="text-orange-600 dark:text-orange-400" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IP đang bị cấm</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{Object.keys(permanentBannedIps).length + Object.keys(temporaryBannedIps).length}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center transition-transform duration-200 hover:scale-[1.02]">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full mr-4">
                      <Fingerprint className="text-purple-600 dark:text-purple-400" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fingerprint đang bị cấm</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{Object.keys(permanentBannedFingerprints).length + Object.keys(temporaryBannedFingerprints).length}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic dark:text-gray-400">Không có dữ liệu thống kê.</p>
              )}
            </section>

            <section className="mb-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <AlertTriangle className="mr-3 text-red-600" size={28} />
                Cấm thủ công
              </h2>
              <form onSubmit={handleBan} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      Loại cấm
                    </label>
                    <Select value={banType} onChange={(e) => setBanType(e.target.value)}>
                      <option value="ip">IP</option>
                      <option value="fingerprint">Fingerprint</option>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      {banType === 'ip' ? 'Địa chỉ IP' : 'ID Fingerprint'}
                    </label>
                    <Input
                      type="text"
                      value={banType === 'ip' ? ipToBan : fingerprintToBan}
                      onChange={(e) => banType === 'ip' ? setIpToBan(e.target.value) : setFingerprintToBan(e.target.value)}
                      placeholder={`Nhập ${banType === 'ip' ? 'địa chỉ IP' : 'ID Fingerprint'}`}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Cấm vĩnh viễn'}
                </Button>
              </form>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                  <Shield className="mr-3 text-orange-600" size={28} />
                  Quản lý IP Bị Cấm
                </h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <Ban className="mr-2 text-red-600" size={20} />
                      Vĩnh viễn
                    </h3>
                    {Object.keys(permanentBannedIps).length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full leading-normal">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Địa chỉ IP
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(permanentBannedIps).map(([ip]) => (
                              <tr key={ip} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{ip}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center">
                                  <Button
                                    onClick={() => handleUnban('ip', ip)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                                  >
                                    Gỡ cấm
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic dark:text-gray-400">Không có IP nào bị cấm vĩnh viễn.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <Ban className="mr-2 text-yellow-600" size={20} />
                      Tạm thời
                    </h3>
                    {Object.keys(temporaryBannedIps).length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full leading-normal">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Địa chỉ IP
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Thời gian hết hạn
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(temporaryBannedIps).map(([ip, expiry]) => (
                              <tr key={ip} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{ip}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{new Date(expiry).toLocaleString('vi-VN')}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center">
                                  <Button
                                    onClick={() => handleUnban('ip', ip)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                                  >
                                    Gỡ cấm
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic dark:text-gray-400">Không có IP nào bị cấm tạm thời.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                  <Fingerprint className="mr-3 text-purple-600" size={28} />
                  Quản lý Fingerprint Bị Cấm
                </h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <Ban className="mr-2 text-red-600" size={20} />
                      Vĩnh viễn
                    </h3>
                    {Object.keys(permanentBannedFingerprints).length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full leading-normal">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                ID Fingerprint
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(permanentBannedFingerprints).map(([fpId]) => (
                              <tr key={fpId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{fpId}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center">
                                  <Button
                                    onClick={() => handleUnban('fingerprint', fpId)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                                  >
                                    Gỡ cấm
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic dark:text-gray-400">Không có Fingerprint nào bị cấm vĩnh viễn.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <Ban className="mr-2 text-yellow-600" size={20} />
                      Tạm thời
                    </h3>
                    {Object.keys(temporaryBannedFingerprints).length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full leading-normal">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                ID Fingerprint
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Thời gian hết hạn
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(temporaryBannedFingerprints).map(([fpId, banTime]) => (
                              <tr key={fpId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{fpId}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">{new Date(banTime).toLocaleString('vi-VN')}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center">
                                  <Button
                                    onClick={() => handleUnban('fingerprint', fpId)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                                  >
                                    Gỡ cấm
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic dark:text-gray-400">Không có Fingerprint nào bị cấm tạm thời.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
