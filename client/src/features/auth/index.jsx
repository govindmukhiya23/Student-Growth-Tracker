import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import PendingPage from './PendingPage.jsx';
import RejectedPage from './RejectedPage.jsx';

export default {
  name: 'auth',
  routes: [
    { path: '/login', element: <LoginPage />, public: true },
    { path: '/register', element: <RegisterPage />, public: true },
    { path: '/pending', element: <PendingPage /> },
    { path: '/rejected', element: <RejectedPage /> },
  ],
};
