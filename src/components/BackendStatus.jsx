// src/components/BackendStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Chúng ta sẽ sử dụng axios để gọi API

const BackendStatus = () => {
  const [message, setMessage] = useState('Đang kết nối Backend...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy URL Backend từ biến môi trường
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBackendStatus = async () => {
      if (!backendUrl) {
        setError(new Error("URL Backend chưa được cấu hình trong .env"));
        setIsLoading(false);
        return;
      }

      try {
        // Gửi yêu cầu GET đến URL gốc của backend
        const response = await axios.get(backendUrl);
        setMessage(response.data.message || 'Không có tin nhắn từ backend');
        console.log("Dữ liệu từ backend:", response.data); // Để kiểm tra trong console trình duyệt
      } catch (err) {
        console.error("Lỗi khi kết nối backend:", err);
        setError(err);
        setMessage('Lỗi khi kết nối Backend!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackendStatus();
  }, [backendUrl]); // `backendUrl` là một dependency để hook chạy lại khi URL thay đổi (ít khi xảy ra)

  if (isLoading) {
    return <p className="text-blue-500">Đang tải trạng thái Backend...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500">
        Lỗi kết nối Backend: {error.message || 'Không thể kết nối.'}
        <br/>
        Vui lòng kiểm tra lại URL Backend trong file .env và trạng thái Backend trên Render.
      </p>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
      <strong className="font-bold">Trạng thái Backend:</strong>{' '}
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default BackendStatus;