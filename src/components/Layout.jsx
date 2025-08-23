// src/components/Layout.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100"> {/* Toàn bộ màn hình, nền xám nhạt */}
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div className="text-2xl font-bold mb-6">Doraemon Admin</div>
        <nav>
          <ul>
            <li className="mb-2">
              <Link to="/" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link> {/* Sử dụng Link */}
            </li>
            <li className="mb-2">
              <Link to="/users" className="block p-2 rounded hover:bg-gray-700">Người dùng</Link> {/* Sử dụng Link */}
            </li>
            <li className="mb-2">
              <Link to="/products" className="block p-2 rounded hover:bg-gray-700">Sản phẩm</Link> {/* Ví dụ thêm */}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          {/* Bạn có thể hiển thị tên trang động ở đây dựa trên route */}
          <h1 className="text-xl font-semibold">Dashboard Admin</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Xin chào, Admin!</span>
            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content Area for Children */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;