import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/components/LoginPage';
import { OAuthCallbackPage } from '@/components/OAuthCallbackPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/DashboardPage';

function App() {
  return (
    <div className="app-shell">
      <div className="mvp-ribbon" aria-label="Versao MVP">
        <span>MVP</span>
      </div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
