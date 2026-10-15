import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { EssaysPage } from './pages/EssaysPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { NewPostPage } from './pages/NewPostPage';
import { EditPostPage } from './pages/EditPostPage';
import { WritersPage } from './pages/WritersPage';
import { PublicAuthorPage } from './pages/PublicAuthorPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Public Landing & Essay Reading Routes */}
            <Route index element={<HomePage />} />
            <Route path="essays" element={<EssaysPage />} />
            <Route path="essays/:id" element={<PostDetailPage />} />
            <Route path="writers" element={<WritersPage />} />
            <Route path="writers/:id" element={<PublicAuthorPage />} />

            {/* Public Guest Auth Routes */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Protected Author Routes */}
            <Route
              path="essays/new"
              element={
                <ProtectedRoute>
                  <NewPostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="essays/:id/edit"
              element={
                <ProtectedRoute>
                  <EditPostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Wildcard redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
