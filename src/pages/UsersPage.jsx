// src/pages/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy URL Backend từ biến môi trường
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null); // Reset lỗi mỗi khi fetch

      if (!backendUrl) {
        setError(new Error("URL Backend chưa được cấu hình trong .env"));
        setIsLoading(false);
        return;
      }

      try {
        // Gọi API để lấy danh sách người dùng
        const response = await axios.get(`${backendUrl}/api/users`);
        setUsers(response.data); // Giả định backend trả về mảng người dùng
      } catch (err) {
        console.error("Lỗi khi lấy người dùng:", err);
        setError(new Error("Không thể tải danh sách người dùng. Vui lòng thử lại."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [backendUrl]); // Dependency array để useEffect chỉ chạy lại khi backendUrl thay đổi

  if (isLoading) {
    return <p className="text-center py-8 text-blue-600 text-lg">Đang tải danh sách người dùng...</p>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 bg-red-100 border border-red-400 rounded-md mx-auto max-w-md">
        <p className="font-bold">Lỗi!</p>
        <p>{error.message}</p>
        <p className="mt-2 text-sm text-red-500">Hãy đảm bảo backend đang chạy và endpoint `/api/users` đã được triển khai.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Người dùng</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {users.length === 0 ? (
          <p className="text-gray-600">Không có người dùng nào để hiển thị.</p>
        ) : (
          <table className="min-w-full bg-white mt-4 border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b text-left text-gray-700">ID</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Tên người dùng</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Email</th>
                {/* Thêm các cột khác nếu có */}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-gray-800">{user.id}</td>
                  <td className="py-2 px-4 border-b text-gray-800">{user.username || 'N/A'}</td> {/* Giả định có trường username */}
                  <td className="py-2 px-4 border-b text-gray-800">{user.email || 'N/A'}</td>
                  {/* Hiển thị các dữ liệu khác của người dùng */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;