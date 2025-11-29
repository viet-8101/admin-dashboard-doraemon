// App.jsx (React) - ĐÃ HOÀN THIỆN BAN TABLE

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Ban, Loader2, LayoutDashboard, Shield, Fingerprint, LogOut, X, AlertTriangle, KeyRound, BookOpen, Plus, Save, Trash2, Edit } from "lucide-react";

// Cấu hình axios để tự động gửi cookie
// CẦN THAY ĐỔI: Sử dụng biến môi trường hoặc cấu hình linh hoạt cho API_BASE_URL khi triển khai.
const API_BASE_URL = 'https://doraemon-backend.onrender.com';
axios.defaults.withCredentials = true;

// --- Components (Tái sử dụng) ---
const Button = ({ children, className, ...props }) => ( <button className={`flex items-center justify-center px-4 py-2 font-semibold text-white rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`} {...props}>{children}</button> );
const Input = ({ className, ...props }) => ( <input className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...props} /> );
const LoadingSpinner = () => ( <div className="flex flex-col items-center justify-center py-16"><Loader2 className="animate-spin h-12 w-12 text-blue-500" /><span className="mt-4 text-xl">Đang tải...</span></div> );
const MessageAlert = ({ message, type, onClose }) => (
    <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-xl flex items-center space-x-3 max-w-sm ${type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
        {type === 'error' ? <AlertTriangle size={24} /> : <Save size={24} />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20"><X size={18} /></button>
    </div>
);

// --- Component Modal Cấm (Ban Modal) ---
const BanModal = ({ onClose, onBan, loading, showMessage }) => {
    const [value, setValue] = useState('');
    const [type, setType] = useState('ip');
    const [duration, setDuration] = useState('permanent');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) {
            showMessage("Vui lòng nhập giá trị cần cấm.", 'error');
            return;
        }
        onBan(type, value, duration);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-6 text-red-600 flex items-center"><Ban className="mr-2"/> Thực hiện Lệnh Cấm</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Giá trị Cần Cấm (IP hoặc Fingerprint ID):</label>
                    <Input 
                        placeholder="Ví dụ: 192.168.1.1 hoặc Fingerprint ID" 
                        value={value} 
                        onChange={(e) => setValue(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Loại Cấm:</label>
                    <select 
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="ip">Địa chỉ IP</option>
                        <option value="fingerprint">Fingerprint ID</option>
                    </select>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Thời gian Cấm:</label>
                    <select 
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                    >
                        <option value="permanent">Vĩnh viễn</option>
                        <option value="3600000">1 giờ</option> {/* 1 giờ = 3600000ms */}
                        <option value="86400000">1 ngày</option> {/* 1 ngày = 86400000ms */}
                        <option value="604800000">1 tuần</option> {/* 1 tuần = 604800000ms */}
                    </select>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600">Hủy</Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Ban className="h-5 w-5 mr-2" />}
                        {loading ? "Đang cấm..." : "Thực hiện Cấm"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

// --- Component Modal Xác nhận (Confirm Modal) ---
const ConfirmModal = ({ title, message, onConfirm, onClose, loading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-orange-600">{title}</h3>
            <p className="mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <Button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600">Hủy</Button>
                <Button type="button" onClick={onConfirm} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Xác nhận"}
                </Button>
            </div>
        </div>
    </div>
);


// SỬA LỖI: Hoàn thiện Component Bảng Cấm (Ban Table)
const BanTable = ({ title, data, type, onUnban }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{title} ({Object.keys(data).length})</h3>
        {Object.keys(data).length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Giá trị</th>
                            {/* Chỉ hiển thị cột "Hết hạn vào" cho cấm tạm thời */}
                            {type === 'temp' && <th className="px-5 py-3 text-left text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Hết hạn vào</th>}
                            <th className="px-5 py-3 text-center text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                        {/* data là object, dùng Object.entries để lặp [value, expiry] */}
                        {Object.entries(data).map(([value, expiry]) => (
                            <tr key={value} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{value}</td>
                                {type === 'temp' && (
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {/* Chuyển đổi timestamp (milliseconds) sang định dạng đọc được */}
                                        {new Date(expiry).toLocaleString('vi-VN')} 
                                    </td>
                                )}
                                <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700 p-2 text-xs" 
                                        onClick={() => onUnban(value)}
                                        title={`Gỡ cấm ${value}`}
                                    >
                                        <KeyRound size={16} className="mr-1"/> Gỡ cấm
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Không có mục nào bị cấm.</p>
        )}
    </div>
);


// --- Component Quản lý Từ Điển (Dictionary Manager) ---
const DictionaryManager = ({ showMessage, setIsLoggedIn }) => {
    const [dictionary, setDictionary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ key: '', value: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const fetchDictionary = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/dictionary`);
            // Chuyển đổi dữ liệu object thành mảng để dễ lặp và sắp xếp
            const dataArray = Object.entries(response.data.dictionary).map(([key, value]) => ({ key, value }));
            setDictionary(dataArray.sort((a, b) => a.key.localeCompare(b.key)));
            setIsLoading(false);
        } catch (error) {
            console.error("Fetch dictionary error:", error);
            showMessage(`Lỗi tải từ điển: ${error.response?.data?.error || error.message}`, 'error');
            setIsLoading(false);
            if (error.response && error.response.status === 401) {
                setIsLoggedIn(false); // Đăng xuất nếu token hết hạn
            }
        }
    }, [showMessage, setIsLoggedIn]);

    useEffect(() => {
        fetchDictionary();
    }, [fetchDictionary]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.key.trim() || !newItem.value.trim()) {
            showMessage("Key và Value không được để trống.", 'error');
            return;
        }

        const isDuplicate = dictionary.some(item => item.key === newItem.key);
        if (isDuplicate) {
            showMessage(`Key "${newItem.key}" đã tồn tại.`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/dictionary`, { key: newItem.key, value: newItem.value });
            showMessage("Thêm mục thành công!", 'success');
            setNewItem({ key: '', value: '' });
            fetchDictionary();
        } catch (error) {
            showMessage(`Lỗi thêm mục: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateItem = async (item) => {
        if (!editingItem.value.trim()) {
            showMessage("Value không được để trống.", 'error');
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/admin/dictionary/${item.key}`, { value: editingItem.value });
            showMessage("Cập nhật thành công!", 'success');
            setEditingItem(null);
            fetchDictionary();
        } catch (error) {
            showMessage(`Lỗi cập nhật: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteItem = async (key) => {
        setConfirmModal({
            title: "Xác nhận Xóa",
            message: `Bạn có chắc muốn xóa key "${key}" vĩnh viễn không?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, loading: true }));
                try {
                    await axios.delete(`${API_BASE_URL}/admin/dictionary/${key}`);
                    showMessage("Xóa mục thành công!", 'success');
                    fetchDictionary();
                    setConfirmModal(null);
                } catch (error) {
                    showMessage(`Lỗi xóa mục: ${error.response?.data?.error || error.message}`, 'error');
                    setConfirmModal(null);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    const startEditing = (item) => setEditingItem(item);
    const cancelEditing = () => setEditingItem(null);

    if (isLoading && dictionary.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center mb-6">
                <BookOpen className="mr-3 text-blue-500"/> Quản Lý Từ Điển Giải Mã
            </h1>

            {/* Form Thêm Mới */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center text-blue-500"><Plus className="mr-2"/> Thêm Mục Mới</h2>
                <form onSubmit={handleAddItem} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            placeholder="Key (Ví dụ: 007)" 
                            value={newItem.key} 
                            onChange={(e) => setNewItem({...newItem, key: e.target.value.trim()})}
                            required
                            disabled={isLoading}
                        />
                        <Input 
                            placeholder="Value (Ví dụ: Bí mật)" 
                            value={newItem.value} 
                            onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Lưu Mục Mới
                    </Button>
                </form>
            </div>

            {/* Bảng Từ Điển */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4">Tổng cộng: {dictionary.length} mục</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs uppercase font-semibold">Key</th>
                                <th className="px-6 py-3 text-left text-xs uppercase font-semibold">Value</th>
                                <th className="px-6 py-3 text-center text-xs uppercase font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {dictionary.map((item) => (
                                <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-gray-900 dark:text-white w-24">
                                        {item.key}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {editingItem?.key === item.key ? (
                                            <Input 
                                                value={editingItem.value} 
                                                onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleUpdateItem(item);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            item.value
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2 w-48">
                                        {editingItem?.key === item.key ? (
                                            <>
                                                <Button className="bg-green-600 hover:bg-green-700 p-2 text-xs" onClick={() => handleUpdateItem(item)} disabled={isLoading}>
                                                    <Save size={16} />
                                                </Button>
                                                <Button className="bg-gray-500 hover:bg-gray-600 p-2 text-xs" onClick={cancelEditing}>
                                                    <X size={16} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button className="bg-yellow-600 hover:bg-yellow-700 p-2 text-xs" onClick={() => startEditing(item)}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button className="bg-red-600 hover:bg-red-700 p-2 text-xs" onClick={() => handleDeleteItem(item.key)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {dictionary.length === 0 && <p className="text-center py-4 text-gray-500">Từ điển trống.</p>}
            </div>

            {confirmModal && (
                <ConfirmModal 
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onClose={() => setConfirmModal(null)}
                    loading={confirmModal.loading || false}
                />
            )}
        </div>
    );
};

// --- Component Login ---
const Login = ({ setIsLoggedIn, showMessage }) => {
    // ... (Giữ nguyên logic Login) ...
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/login`, { password });
            setIsLoggedIn(true);
            showMessage("Đăng nhập thành công!", 'success');
        } catch (error) {
            const message = error.response?.data?.error || "Lỗi đăng nhập không xác định.";
            showMessage(message, 'error');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
                    Đăng nhập Bảng điều khiển Admin
                </h2>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        type="password"
                        placeholder="Mật khẩu Admin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Đăng nhập"}
                    </Button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Chỉ dành cho quản trị viên.
                </p>
            </div>
        </div>
    );
};


// --- Component Chính (App) ---
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ban'); // 'ban' hoặc 'dictionary'
    const [bannedData, setBannedData] = useState({ pIps: {}, tIps: {}, pFps: {}, tFps: {} });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const showMessage = (msg, type = 'success') => {
        setMessage({ msg, type });
        setTimeout(() => setMessage(null), 5000);
    };

    // Kiểm tra trạng thái đăng nhập
    const checkAuthStatus = useCallback(async () => {
        try {
            // Endpoint kiểm tra đăng nhập (ví dụ: /admin/me)
            await axios.get(`${API_BASE_URL}/admin/me`);
            setIsLoggedIn(true);
        } catch (error) {
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch dữ liệu IP bị cấm
    const fetchBannedData = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/banned`);
            setBannedData(response.data);
        } catch (error) {
            console.error("Fetch banned data error:", error);
            showMessage(`Lỗi tải dữ liệu cấm: ${error.response?.data?.error || error.message}`, 'error');
            if (error.response && error.response.status === 401) {
                setIsLoggedIn(false);
            }
        }
    }, [isLoggedIn, showMessage]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    useEffect(() => {
        fetchBannedData();
    }, [isLoggedIn, fetchBannedData]);

    // Xử lý cấm/gỡ cấm
    const handleBanAction = (action, type, value, duration = 'permanent') => {
        const actionType = action === 'ban' ? `Cấm ${type}` : `Gỡ cấm ${type}`;
        
        setConfirmAction({
            title: `Xác nhận ${actionType}`,
            message: `Bạn có chắc chắn muốn ${action} ${type} này (${value}) không?`,
            onConfirm: async () => {
                setConfirmAction(prev => ({ ...prev, loading: true }));
                setIsLoading(true);
                
                try {
                    let endpoint = `${API_BASE_URL}/admin/${action}`;
                    let payload = { type, value };
                    if (action === 'ban' && duration !== 'permanent') {
                        payload.duration = duration;
                    }
                    
                    await axios.post(endpoint, payload);
                    showMessage(`${actionType} thành công!`, 'success');
                    fetchBannedData();
                    if (action === 'ban') setIsModalOpen(false);

                } catch (error) {
                    showMessage(`Lỗi ${actionType}: ${error.response?.data?.error || error.message}`, 'error');
                } finally {
                    setConfirmAction(null);
                    setIsLoading(false);
                }
            }
        });
    };
    
    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/admin/logout`);
            setIsLoggedIn(false);
            showMessage("Đã đăng xuất.", 'success');
        } catch (error) {
            showMessage(`Lỗi đăng xuất: ${error.message}`, 'error');
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isLoggedIn) {
        return <Login setIsLoggedIn={setIsLoggedIn} showMessage={showMessage} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Header / Sidebar Navigation */}
            <div className="flex bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center w-full p-4">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                        <Shield className="mr-2"/> Admin Console
                    </h1>
                    <div className="flex items-center space-x-4">
                        <Button 
                            className={`px-3 py-2 ${activeTab === 'ban' ? 'bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                            onClick={() => setActiveTab('ban')}
                        >
                            <LayoutDashboard size={20} className="mr-1"/> Quản lý Ban
                        </Button>
                        <Button 
                            className={`px-3 py-2 ${activeTab === 'dictionary' ? 'bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                            onClick={() => setActiveTab('dictionary')}
                        >
                            <BookOpen size={20} className="mr-1"/> Từ Điển
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={handleLogout} title="Đăng xuất">
                            <LogOut size={20} className="mr-1"/> 
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
                {activeTab === 'ban' ? (
                    <>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center">
                        <LayoutDashboard className="mr-3 text-blue-500"/> Bảng Điều Khiển Bảo Mật
                    </h1>
                    
                    <div className="mb-8 flex justify-end">
                        <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsModalOpen(true)}>
                            <Ban className="mr-2"/> Thực hiện Cấm Mới
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Quản lý IP */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold flex items-center text-orange-600 dark:text-orange-400">
                                <Shield className="mr-3"/> Quản lý IP Bị Cấm
                            </h2>
                            <BanTable title="Vĩnh viễn" data={bannedData.pIps} onUnban={(value) => handleBanAction('unban', 'ip', value)} />
                            <BanTable title="Tạm thời" data={bannedData.tIps} type="temp" onUnban={(value) => handleBanAction('unban', 'ip', value)} />
                        </div>
                        
                        {/* Quản lý Fingerprint */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold flex items-center text-purple-600 dark:text-purple-400">
                                <Fingerprint className="mr-3"/> Quản lý Fingerprint Bị Cấm
                            </h2>
                            <BanTable title="Vĩnh viễn" data={bannedData.pFps} onUnban={(value) => handleBanAction('unban', 'fingerprint', value)} />
                            <BanTable title="Tạm thời" data={bannedData.tFps} type="temp" onUnban={(value) => handleBanAction('unban', 'fingerprint', value)} />
                        </div>
                    </div>
                    </>
                ) : (
                    <DictionaryManager showMessage={showMessage} setIsLoggedIn={setIsLoggedIn} />
                )}
            </div>
            
            {/* Modals and Alerts */}
            {isModalOpen && <BanModal onClose={() => setIsModalOpen(false)} onBan={(type, value, duration) => handleBanAction('ban', type, value, duration)} loading={isLoading} showMessage={showMessage}/>}
            {confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    onConfirm={confirmAction.onConfirm}
                    onClose={() => setConfirmAction(null)}
                    loading={confirmAction.loading || false}
                />
            )}
            {message && <MessageAlert message={message.msg} type={message.type} onClose={() => setMessage(null)} />}
            {isLoading && !confirmAction && <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-40"><LoadingSpinner /></div>}
        </div>
    );
}

export default App;