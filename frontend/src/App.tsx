import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './App.css';

// Route-level code splitting for performance optimization
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const EssaysPage = lazy(() => import('./pages/EssaysPage').then((m) => ({ default: m.EssaysPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })));
const TopicsPage = lazy(() => import('./pages/TopicsPage').then((m) => ({ default: m.TopicsPage })));
const WritersPage = lazy(() => import('./pages/WritersPage').then((m) => ({ default: m.WritersPage })));
const PublicAuthorPage = lazy(() => import('./pages/PublicAuthorPage').then((m) => ({ default: m.PublicAuthorPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const NewPostPage = lazy(() => import('./pages/NewPostPage').then((m) => ({ default: m.NewPostPage })));
const EditPostPage = lazy(() => import('./pages/EditPostPage').then((m) => ({ default: m.EditPostPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

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
            <Route path="topics" element={<TopicsPage />} />
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
