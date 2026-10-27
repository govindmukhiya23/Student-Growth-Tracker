import AdminRegistrationsPage from './AdminRegistrationsPage.jsx';

export default {
  name: 'users',
  routes: [
    {
      path: '/admin/registrations',
      element: <AdminRegistrationsPage />,
      roles: ['admin'],
    },
  ],
};
