// src/pages/DashboardPage.jsx
import React from 'react';
import BackendStatus from '../components/BackendStatus'; // Import component BackendStatus

const DashboardPage = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Tổng quan Dashboard</h2>

      {/* Thêm component hiển thị trạng thái Backend ở đây */}
      <div className="mb-6">
        <BackendStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Số lượng người dùng</h3>
          <p className="text-3xl font-bold text-blue-500">1,234</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Đơn hàng mới</h3>
          <p className="text-3xl font-bold text-green-500">56</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Doanh thu</h3>
          <p className="text-3xl font-bold text-yellow-500">$12,345</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;