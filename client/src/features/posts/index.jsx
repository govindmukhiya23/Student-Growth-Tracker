import MyPostsPage from './MyPostsPage.jsx';
import AdminVerificationQueuePage from './AdminVerificationQueuePage.jsx';

export default {
  name: 'posts',
  routes: [
    {
      path: '/posts/mine',
      element: <MyPostsPage />,
    },
    {
      path: '/posts',
      element: <MyPostsPage />,
    },
    {
      path: '/admin/posts',
      element: <AdminVerificationQueuePage />,
      roles: ['admin'],
    },
  ],
};
