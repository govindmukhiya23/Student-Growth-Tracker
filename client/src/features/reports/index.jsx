import AdminReportsPage from './AdminReportsPage.jsx';

export default {
  name: 'reports',
  routes: [
    {
      path: '/admin/reports',
      element: <AdminReportsPage />,
      roles: ['admin'],
    },
  ],
};
