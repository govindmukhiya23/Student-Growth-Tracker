import AdminRegistrationsPage from './AdminRegistrationsPage.jsx';
import AdminStudentsPage from './AdminStudentsPage.jsx';

export default {
  name: 'users',
  routes: [
    {
      path: '/admin/students',
      element: <AdminStudentsPage />,
      roles: ['admin'],
    },
    {
      path: '/admin/registrations',
      element: <AdminRegistrationsPage />,
      roles: ['admin'],
    },
    {
      path: '/admin',
      element: <AdminStudentsPage />,
      roles: ['admin'],
    },
    {
      path: '/admin/dashboard',
      element: <AdminStudentsPage />,
      roles: ['admin'],
    },
  ],
};
