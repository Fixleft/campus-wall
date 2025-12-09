import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashBoard';
import AuthGuard from '@/components/AuthGuard';
import { Toaster } from "sonner";

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        {/* 登录页 (公开) */}
        <Route path="/login" element={<Login />} />

        {/* 主页 (受保护) */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <AdminDashboard />
            </AuthGuard>
          } 
        />

        {/* 默认跳转 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-center" richColors /> 
    </>
  );
}

export default App;