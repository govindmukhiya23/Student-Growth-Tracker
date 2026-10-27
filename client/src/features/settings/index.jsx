import AdminSettingsPage from './AdminSettingsPage.jsx';

export default {
  name: 'settings',
  routes: [
    {
      path: '/admin/settings',
      element: <AdminSettingsPage />,
      roles: ['admin'],
    },
  ],
};
