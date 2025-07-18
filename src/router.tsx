import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import MyImages from './pages/MyImages';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Función para verificar autenticación
const requireAuth = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated) {
    return '/login';
  }
  return null;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword />,
  },
  {
    path: '/profile',
    element: <Profile />,
    loader: requireAuth,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    loader: requireAuth,
  },
  {
    path: '/my-images',
    element: <MyImages />,
    loader: requireAuth,
  },
]);