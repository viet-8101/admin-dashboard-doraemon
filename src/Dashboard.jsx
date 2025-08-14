// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate để chuyển hướng

// Định nghĩa giá trị cho ban vĩnh viễn, khớp với backend
const PERMANENT_BAN_VALUE = Number.MAX_SAFE_INTEGER;

function Dashboard({ setIsLoggedIn }) { // Nhận setIsLoggedIn làm prop
  const [backendStatus, setBackendStatus] = useState("Đang kết nối...");
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [banValue, setBanValue] = useState(''); // Giá trị IP hoặc Fingerprint để ban/unban
  const [banType, setBanType] = useState('ip'); // Loại: 'ip' hoặc 'fingerprint'
  const [banMessage, setBanMessage] = useState(''); // Thông báo sau khi ban/unban

  const navigate = useNavigate(); // Khởi tạo hook useNavigate
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Hàm xử lý lỗi chung cho các request API
  const handleApiError = (err) => {
    console.error("Lỗi API:", err);
    if (err.response) {
      // Lỗi từ phản hồi của server
      if (err.response.status === 403 || err.response.status === 401) {
        if (err.response.data && err.response.data.error === "Token không hợp lệ hoặc đã hết hạn.") {
          setError("Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
          localStorage.removeItem('adminToken'); // Xóa token cũ
          if (setIsLoggedIn) setIsLoggedIn(false); // Cập nhật trạng thái đăng nhập
          navigate('/'); // Chuyển hướng về trang đăng nhập
        } else {
          // Lỗi 403/401 khác (ví dụ: không có quyền truy cập)
          setError(err.response.data.error || "Bạn không có quyền truy cập tài nguyên này.");
        }
      } else {
        // Các lỗi HTTP khác
        setError(`Lỗi ${err.response.status}: ${err.response.data.error || err.response.statusText}`);
      }
    } else if (err.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi (lỗi mạng)
      setError("Lỗi kết nối Backend: Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra URL Backend hoặc trạng thái máy chủ.");
    } else {
      // Lỗi trong quá trình thiết lập request
      setError(`Lỗi: ${err.message}`);
    }
  };

  // Hàm này sẽ tải lại dữ liệu dashboard
  const fetchDashboardData = async () => {
    if (!BACKEND_URL) {
      setError("Lỗi: Không tìm thấy URL Backend trong biến môi trường.");
      setBackendStatus("Lỗi cấu hình URL Backend");
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        setBackendStatus("Chưa xác thực Admin");
        if (setIsLoggedIn) setIsLoggedIn(false); // Cập nhật trạng thái đăng nhập
        navigate('/');
        return;
      }

      // Kiểm tra trạng thái backend (tùy chọn)
      try {
        const statusResponse = await axios.get(`${BACKEND_URL}/`);
        if (statusResponse.status === 200 && statusResponse.data.includes("Backend Doraemon đang chạy")) {
          setBackendStatus("Backend đang hoạt động tốt.");
        } else {
          setBackendStatus("Backend có vẻ không hoạt động như mong đợi.");
        }
      } catch (statusErr) {
        console.error("Lỗi kiểm tra trạng thái Backend:", statusErr);
        setBackendStatus("Không thể kiểm tra trạng thái Backend.");
      }
      
      // Lấy dữ liệu dashboard
      const statsResponse = await axios.get(`${BACKEND_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (statsResponse.data.success) {
        setDashboardData(statsResponse.data.stats);
        // Cập nhật banned_ips và banned_fingerprints từ API
        // Đảm bảo rằng statsResponse.data.stats.banned_ips và banned_fingerprints được cập nhật đúng cách
        // Nếu API trả về trực tiếp banned_ips/fingerprints ở cấp root, bạn cần gán chúng vào stats
        if (statsResponse.data.banned_ips) {
          statsResponse.data.stats.banned_ips = statsResponse.data.banned_ips;
        }
        if (statsResponse.data.banned_fingerprints) {
          statsResponse.data.stats.banned_fingerprints = statsResponse.data.banned_fingerprints;
        }
        setDashboardData(statsResponse.data.stats); // Cập nhật state với dữ liệu mới
      } else {
        setError(statsResponse.data.error || "Lỗi khi lấy dữ liệu Dashboard.");
      }

    } catch (err) {
      handleApiError(err); // Gọi hàm xử lý lỗi chung
      setBackendStatus("Lỗi khi tải dữ liệu");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate, setIsLoggedIn]); // Thêm setIsLoggedIn vào dependency array để useEffect không bị cảnh báo

  // Hàm xử lý Ban
  const handleBan = async () => {
    if (!banValue) {
      setBanMessage('Vui lòng nhập giá trị để ban.');
      return;
    }
    setBanMessage('Đang xử lý...');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        navigate('/');
        return;
      }
      const response = await axios.post(`${BACKEND_URL}/admin/ban`, {
        type: banType,
        value: banValue,
        reason: 'Manual ban by admin' // Bạn có thể thêm input cho lý do
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBanMessage(response.data.message || 'Ban thành công!');
      setBanValue(''); // Xóa giá trị sau khi ban
      fetchDashboardData(); // Tải lại dữ liệu dashboard
    } catch (err) {
      handleApiError(err); // Gọi hàm xử lý lỗi chung
      setBanMessage(err.response?.data?.error || 'Lỗi khi ban.');
    }
  };

  // Hàm xử lý Unban
  const handleUnban = async () => {
    if (!banValue) {
      setBanMessage('Vui lòng nhập giá trị để unban.');
      return;
    }
    setBanMessage('Đang xử lý...');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        navigate('/');
        return;
      }
      const response = await axios.post(`${BACKEND_URL}/admin/unban`, {
        type: banType,
        value: banValue,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBanMessage(response.data.message || 'Unban thành công!');
      setBanValue(''); // Xóa giá trị sau khi unban
      fetchDashboardData(); // Tải lại dữ liệu dashboard
    } catch (err) {
      handleApiError(err); // Gọi hàm xử lý lỗi chung
      setBanMessage(err.response?.data?.error || 'Lỗi khi unban.');
    }
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // Xóa token khỏi localStorage
    if (setIsLoggedIn) setIsLoggedIn(false); // Cập nhật trạng thái đăng nhập trong AppWrapper
    navigate('/'); // Chuyển hướng về trang đăng nhập
  };

  return (
    <div className="p-5 max-w-4xl mx-auto bg-white rounded-lg shadow-md mt-10">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Đăng xuất
        </button>
      </div>
      
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <p className="text-gray-700 mb-3">Trạng thái Backend: <span className="font-semibold">{backendStatus}</span></p>

      {dashboardData ? (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-700">Thống kê tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-xl font-bold">{dashboardData.total_requests}</p>
              <p className="text-blue-700">Tổng số yêu cầu</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="text-xl font-bold">{Object.keys(dashboardData.banned_ips || {}).length}</p>
              <p className="text-red-700">Tổng số IP bị ban</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <p className="text-xl font-bold">{Object.keys(dashboardData.banned_fingerprints || {}).length}</p>
              <p className="text-yellow-700">Tổng số Fingerprint bị ban</p>
            </div>
          </div>

          <h4 className="text-xl font-semibold text-gray-700 mt-6">Danh sách IP bị ban:</h4>
          {Object.keys(dashboardData.banned_ips || {}).length > 0 ? (
            <ul className="list-disc pl-5 bg-gray-50 p-3 rounded-lg">
              {Object.entries(dashboardData.banned_ips).map(([ip, expiresAt]) => (
                <li key={ip} className="text-gray-800">
                  <strong>{ip}</strong> - Hết hạn: {
                    expiresAt === PERMANENT_BAN_VALUE ? 'Vĩnh viễn (đến khi unban)' : new Date(expiresAt).toLocaleString('vi-VN')
                  }
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Không có IP nào bị ban.</p>
          )}

          <h4 className="text-xl font-semibold text-gray-700 mt-6">Danh sách Fingerprint bị ban:</h4>
          {Object.keys(dashboardData.banned_fingerprints || {}).length > 0 ? (
            <ul className="list-disc pl-5 bg-gray-50 p-3 rounded-lg">
              {Object.entries(dashboardData.banned_fingerprints).map(([fp, expiresAt]) => (
                <li key={fp} className="text-gray-800">
                  <strong>{fp}</strong> - Hết hạn: {
                    expiresAt === PERMANENT_BAN_VALUE ? 'Vĩnh viễn (đến khi unban)' : new Date(expiresAt).toLocaleString('vi-VN')
                  }
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Không có Fingerprint nào bị ban.</p>
          )}

          {/* Form Ban/Unban */}
          <div className="mt-8 p-5 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Quản lý Ban/Unban</h3>
            {banMessage && <p className={`mb-3 ${banMessage.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>{banMessage}</p>}
            <div className="mb-4">
              <label htmlFor="banValue" className="block text-gray-700 text-sm font-bold mb-2">Giá trị (IP hoặc Fingerprint):</label>
              <input
                type="text"
                id="banValue"
                value={banValue}
                onChange={(e) => setBanValue(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Nhập IP hoặc Fingerprint"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="banType" className="block text-gray-700 text-sm font-bold mb-2">Loại:</label>
              <select
                id="banType"
                value={banType}
                onChange={(e) => setBanType(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="ip">IP</option>
                <option value="fingerprint">Fingerprint</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleBan}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Ban
              </button>
              <button
                onClick={handleUnban}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Unban
              </button>
            </div>
          </div>

        </div>
      ) : (
        !error && <p className="text-gray-600">Đang tải dữ liệu dashboard...</p>
      )}
    </div>
  );
}

export default Dashboard;
