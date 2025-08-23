import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Ban, Loader2, LayoutDashboard, Shield, Fingerprint, LogOut, X, AlertTriangle, KeyRound, BookOpen, Plus, Save, Trash2, Edit } from "lucide-react";

// Cấu hình axios để tự động gửi cookie
const API_BASE_URL = 'https://doraemon-backend.onrender.com';
axios.defaults.withCredentials = true;

// --- Components (Tái sử dụng) ---
const Button = ({ children, className, ...props }) => ( <button className={`flex items-center justify-center px-4 py-2 font-semibold text-white rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`} {...props}>{children}</button> );
const Input = ({ className, ...props }) => ( <input className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...props} /> );
const LoadingSpinner = () => ( <div className="flex flex-col items-center justify-center py-16"><Loader2 className="animate-spin h-12 w-12 text-blue-500" /><span className="mt-4 text-xl">Đang tải...</span></div> );
const MessageAlert = ({ message, onClose }) => ( <div className={`flex items-center justify-between p-4 mb-6 rounded-lg text-sm shadow-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}><span>{message.text}</span><button onClick={onClose} className="p-1 rounded-full hover:bg-black/10"><X size={16} /></button></div> );
const BanModal = ({ onClose, onBan, loading, showMessage }) => { 
    const [banType, setBanType] = useState(null);
    const [banValue, setBanValue] = useState('');
  
    const handleFinalBan = (e) => { 
        e.preventDefault(); 
        if (!banValue) {
            showMessage(`Vui lòng nhập ${banType === 'ip' ? 'địa chỉ IP' : 'ID Fingerprint'} để cấm.`, 'error');
            return;
        }
        onBan(banType, banValue); 
        setBanValue(''); 
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Chọn loại cấm</h3><button onClick={onClose}><X size={24} /></button></div>
          {!banType ? (
            <div className="space-y-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setBanType('ip')}><Shield size={20} className="mr-2" /> Cấm IP</Button>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setBanType('fingerprint')}><Fingerprint size={20} className="mr-2" /> Cấm Fingerprint</Button>
            </div>
          ) : (
            <form onSubmit={handleFinalBan} className="space-y-4">
              <h4 className="text-lg font-semibold">Cấm {banType} vĩnh viễn</h4>
              <Input type="text" value={banValue} onChange={(e) => setBanValue(e.target.value)} placeholder={`Nhập ${banType}...`} required />
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : 'Cấm'}</Button>
              <Button type="button" className="w-full bg-gray-500 hover:bg-gray-600" onClick={() => setBanType(null)}>Quay lại</Button>
            </form>
          )}
        </div>
      </div>
    );
};
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <Button className="bg-gray-500 hover:bg-gray-600" onClick={onClose}>Hủy</Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>Xác nhận</Button>
                </div>
            </div>
        </div>
    );
};

// --- Component Quản lý Từ điển ---
const DictionaryManager = ({ showMessage, setIsLoggedIn }) => {
    const [dictionary, setDictionary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingEntry, setEditingEntry] = useState(null);
    const [newEntry, setNewEntry] = useState({ key: '', value: '' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null, message: '' });

    const fetchDictionary = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/admin/dictionary`);
            setDictionary(response.data);
        } catch (error) { 
            showMessage('Không thể tải từ điển.', 'error'); 
            if (error.response?.status === 401 || error.response?.status === 403) {
                setIsLoggedIn(false);
                showMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
            }
        } 
        finally { setLoading(false); }
    }, [showMessage, setIsLoggedIn]);

    useEffect(() => { fetchDictionary(); }, [fetchDictionary]);

    const handleAction = async (action, payload) => {
        try {
            switch (action) {
                case 'add':
                    await axios.post(`${API_BASE_URL}/admin/dictionary`, payload);
                    showMessage('Thêm từ mới thành công!', 'success');
                    setNewEntry({ key: '', value: '' });
                    break;
                case 'update':
                    await axios.put(`${API_BASE_URL}/admin/dictionary/${payload.id}`, { key: payload.key, value: payload.value });
                    showMessage('Cập nhật thành công!', 'success');
                    setEditingEntry(null);
                    break;
                case 'delete':
                    setConfirmState({
                        isOpen: true,
                        message: `Bạn có chắc chắn muốn xóa từ khóa "${payload.key}" không?`,
                        onConfirm: async () => {
                            await axios.delete(`${API_BASE_URL}/admin/dictionary/${payload.id}`);
                            showMessage('Đã xóa thành công!', 'success');
                            setConfirmState({ isOpen: false, onConfirm: null, message: '' });
                            fetchDictionary();
                        }
                    });
                    return;
                default: break;
            }
            fetchDictionary();
        } catch (error) { 
            showMessage(error.response?.data?.error || 'Thao tác thất bại.', 'error'); 
            if (error.response?.status === 401 || error.response?.status === 403) {
                setIsLoggedIn(false);
                showMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, onConfirm: null, message: '' })}
                onConfirm={confirmState.onConfirm}
                title="Xác nhận hành động"
                message={confirmState.message}
            />
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
                <h2 className="text-2xl font-bold mb-6 flex items-center"><BookOpen className="mr-3 text-green-600" />Quản lý Từ điển</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleAction('add', newEntry); }} className="mb-8 p-4 border rounded-lg grid md:grid-cols-3 gap-4 items-end">
                    <div><label className="text-sm font-medium">Từ khóa (Key)</label><Input value={newEntry.key} onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })} required /></div>
                    <div><label className="text-sm font-medium">Kết quả (Value)</label><Input value={newEntry.value} onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })} required /></div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700"><Plus className="mr-2"/>Thêm mới</Button>
                </form>
                <div className="overflow-x-auto"><table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-5 py-3 text-left text-xs uppercase font-semibold">Từ khóa</th><th className="px-5 py-3 text-left text-xs uppercase font-semibold">Kết quả</th><th className="px-5 py-3 text-center text-xs uppercase font-semibold">Hành động</th></tr></thead>
                    <tbody>{dictionary.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-5 py-4 border-b dark:border-gray-600">{editingEntry?.id === entry.id ? <Input value={editingEntry.key} onChange={e => setEditingEntry({...editingEntry, key: e.target.value})} /> : entry.key}</td>
                            <td className="px-5 py-4 border-b dark:border-gray-600">{editingEntry?.id === entry.id ? <Input value={editingEntry.value} onChange={e => setEditingEntry({...editingEntry, value: e.target.value})} /> : entry.value}</td>
                            <td className="px-5 py-4 border-b dark:border-gray-600 text-center"><div className="flex justify-center gap-2">
                                {editingEntry?.id === entry.id ? (<>
                                    <Button className="bg-blue-600 p-2" onClick={() => handleAction('update', editingEntry)}><Save size={18}/></Button>
                                    <Button className="bg-gray-500 p-2" onClick={() => setEditingEntry(null)}><X size={18}/></Button>
                                </>) : (<>
                                    <Button className="bg-yellow-500 p-2" onClick={() => setEditingEntry({...entry})}><Edit size={18}/></Button>
                                    <Button className="bg-red-600 p-2" onClick={() => handleAction('delete', {id: entry.id, key: entry.key})}><Trash2 size={18}/></Button>
                                </>)}
                            </div></td>
                        </tr>
                    ))}</tbody>
                </table></div>
            </div>
        </>
    );
};

// --- Component Chính ---
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeView, setActiveView] = useState('stats');
    const [stats, setStats] = useState(null);
    const [bannedData, setBannedData] = useState({ pIps: {}, tIps: {}, pFps: {}, tFps: {} });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loginStep, setLoginStep] = useState('credentials');
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [tfa, setTfa] = useState({ token: '', code: '', qrCodeUrl: null });

    const showMessage = useCallback((text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    }, []);

    useEffect(() => {
        const verifySession = async () => {
            try {
                await axios.get(`${API_BASE_URL}/admin/verify-session`);
                setIsLoggedIn(true);
            } catch (error) {
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };
        verifySession();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/login`, credentials);
            setTfa({ ...tfa, token: res.data.tfaToken, qrCodeUrl: res.data.qrCodeUrl });
            setLoginStep('tfa');
            showMessage(res.data.message, 'success');
        } catch (error) {
            showMessage(error.response?.data?.error || 'Đăng nhập thất bại.', 'error');
        } finally { setIsLoading(false); }
    };

    const handleVerifyTfa = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/verify-tfa`, { tfaToken: tfa.token, tfaCode: tfa.code });
            setIsLoggedIn(true);
            showMessage('Đăng nhập thành công!', 'success');
            setLoginStep('credentials');
            setCredentials({ username: '', password: '' });
            setTfa({ token: '', code: '', qrCodeUrl: null });
        } catch (error) {
            showMessage(error.response?.data?.error || 'Xác thực 2FA thất bại.', 'error');
        } finally { setIsLoading(false); }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/admin/logout`);
            setIsLoggedIn(false);
            showMessage('Đã đăng xuất.', 'success');
        } catch (error) { showMessage('Lỗi khi đăng xuất.', 'error'); }
    };

    const fetchData = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/dashboard-data`);
            setStats(res.data.stats);
            setBannedData({
                pIps: res.data.permanent_banned_ips || {}, tIps: res.data.temporary_banned_ips || {},
                pFps: res.data.permanent_banned_fingerprints || {}, tFps: res.data.temporary_banned_fingerprints || {},
            });
        } catch (error) { 
            showMessage(error.response?.data?.error || 'Không thể tải dữ liệu dashboard.', 'error');
            if (error.response?.status === 401 || error.response?.status === 403) {
                setIsLoggedIn(false);
                showMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
            }
        } 
        finally { setIsLoading(false); }
    }, [isLoggedIn, showMessage]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleBanAction = async (action, type, value) => {
        try {
            setIsLoading(true);
            const endpoint = action === 'ban' ? '/admin/ban' : '/admin/unban';
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, { type, value, duration: 'permanent' });
            showMessage(res.data.message, 'success');
            if(action === 'ban') setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.error || 'Thao tác thất bại.', 'error');
            if (error.response?.status === 401 || error.response?.status === 403) {
                setIsLoggedIn(false);
                showMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !isLoggedIn) return <LoadingSpinner />;

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl w-full max-w-md">
                    {message && <MessageAlert message={message} onClose={() => setMessage(null)} />}
                    {loginStep === 'credentials' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <h2 className="text-4xl font-extrabold text-center">Đăng nhập Admin</h2>
                            <div><label>Tên đăng nhập</label><Input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} required/></div>
                            <div><label>Mật khẩu</label><Input type="password" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} required/></div>
                            <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin"/> : 'Tiếp tục'}</Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyTfa} className="space-y-6">
                            <h2 className="text-3xl font-extrabold text-center">Xác thực 2 bước</h2>
                            {tfa.qrCodeUrl && (
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="mb-2">Quét mã QR này bằng ứng dụng xác thực của bạn:</p>
                                    <img src={tfa.qrCodeUrl} alt="QR Code" className="mx-auto bg-white p-2 rounded-md" />
                                </div>
                            )}
                            <div><label>Mã xác thực</label><Input type="text" value={tfa.code} onChange={(e) => setTfa({...tfa, code: e.target.value})} required placeholder="Nhập mã 6 số"/></div>
                            <Button type="submit" className="w-full bg-green-600" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin"/> : <><KeyRound className="mr-2"/> Xác thực</>}</Button>
                            <Button type="button" className="w-full bg-gray-500" onClick={() => setLoginStep('credentials')}>Quay lại</Button>
                        </form>
                    )}
                </div>
            </div>
        );
    }
    
    const BanTable = ({ title, data, type, onUnban }) => (
        <div>
            <h3 className="text-xl font-semibold mb-4">{title} ({Object.keys(data).length})</h3>
            {Object.keys(data).length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full">
                        <tbody>{Object.entries(data).map(([value, expiry]) => (
                            <tr key={value} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-5 py-3 border-b dark:border-gray-600 text-sm break-all">{value}</td>
                                {type === 'temp' && <td className="px-5 py-3 border-b dark:border-gray-600 text-sm">{new Date(expiry).toLocaleString('vi-VN')}</td>}
                                <td className="px-5 py-3 border-b dark:border-gray-600 text-sm text-center">
                                    <Button className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs" onClick={() => onUnban(value)}>Gỡ cấm</Button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="italic text-gray-500">Không có dữ liệu.</p>}
        </div>
    );

    return (
        <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans text-gray-900 dark:text-white ${isModalOpen ? 'overflow-hidden' : ''}`}>
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
                    <h1 className="text-3xl font-bold flex items-center mb-4 md:mb-0"><LayoutDashboard className="mr-3 text-blue-600" />Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <nav className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Button className={`px-3 py-1 text-sm ${activeView === 'stats' ? 'bg-blue-600' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-blue-400'}`} onClick={() => setActiveView('stats')}>Thống kê</Button>
                            <Button className={`px-3 py-1 text-sm ${activeView === 'dictionary' ? 'bg-blue-600' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-blue-400'}`} onClick={() => setActiveView('dictionary')}>Từ điển</Button>
                        </nav>
                        <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700"><LogOut size={20} className="mr-2" />Đăng xuất</Button>
                    </div>
                </header>
                {message && <MessageAlert message={message} onClose={() => setMessage(null)} />}
                {isLoading ? <LoadingSpinner /> : (
                    activeView === 'stats' ? (
                        <>
                         <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats ? Object.entries({
                                'Tổng yêu cầu': stats.total_requests, 'reCAPTCHA thất bại': stats.total_failed_recaptcha,
                                'IP bị cấm': Object.keys(bannedData.pIps).length + Object.keys(bannedData.tIps).length,
                                'Fingerprint bị cấm': Object.keys(bannedData.pFps).length + Object.keys(bannedData.tFps).length
                            }).map(([label, value]) => (
                                <div key={label} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                                    <p className="text-sm text-gray-500">{label}</p>
                                    <p className="text-3xl font-bold">{value}</p>
                                </div>
                            )) : <p>Đang tải thống kê...</p>}
                         </section>
                         <section className="mb-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
                            <h2 className="text-2xl font-bold mb-4 flex items-center"><AlertTriangle className="mr-3 text-red-600"/>Cấm thủ công</h2>
                            <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">Mở công cụ cấm</Button>
                         </section>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md space-y-6">
                                <h2 className="text-2xl font-bold flex items-center"><Shield className="mr-3 text-orange-600"/>Quản lý IP Bị Cấm</h2>
                                <BanTable title="Vĩnh viễn" data={bannedData.pIps} onUnban={(value) => handleBanAction('unban', 'ip', value)} />
                                <BanTable title="Tạm thời" data={bannedData.tIps} type="temp" onUnban={(value) => handleBanAction('unban', 'ip', value)} />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md space-y-6">
                                <h2 className="text-2xl font-bold flex items-center"><Fingerprint className="mr-3 text-purple-600"/>Quản lý Fingerprint Bị Cấm</h2>
                                <BanTable title="Vĩnh viễn" data={bannedData.pFps} onUnban={(value) => handleBanAction('unban', 'fingerprint', value)} />
                                <BanTable title="Tạm thời" data={bannedData.tFps} type="temp" onUnban={(value) => handleBanAction('unban', 'fingerprint', value)} />
                            </div>
                         </div>
                        </>
                    ) : (
                        <DictionaryManager showMessage={showMessage} setIsLoggedIn={setIsLoggedIn} />
                    )
                )}
            </div>
            {isModalOpen && <BanModal onClose={() => setIsModalOpen(false)} onBan={(type, value) => handleBanAction('ban', type, value)} loading={isLoading} showMessage={showMessage}/>}
        </div>
    );
}

export default App;