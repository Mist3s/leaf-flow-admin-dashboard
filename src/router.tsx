import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { RouteObject } from 'react-router';

import SidebarLayout from 'src/layouts/SidebarLayout';
import BaseLayout from 'src/layouts/BaseLayout';

import SuspenseLoader from 'src/components/SuspenseLoader';
import ProtectedRoute from 'src/components/ProtectedRoute';

const Loader = (Component) => (props) =>
  (
    <Suspense fallback={<SuspenseLoader />}>
      <Component {...props} />
    </Suspense>
  );

// Auth
const Login = Loader(lazy(() => import('src/content/pages/Auth/Login')));

// Admin Pages
const Dashboard = Loader(lazy(() => import('src/content/admin/Dashboard')));
const ProductsList = Loader(lazy(() => import('src/content/admin/Products')));
const ProductForm = Loader(lazy(() => import('src/content/admin/Products/ProductForm')));
const OrdersList = Loader(lazy(() => import('src/content/admin/Orders')));
const OrderDetail = Loader(lazy(() => import('src/content/admin/Orders/OrderDetail')));
const CategoriesList = Loader(lazy(() => import('src/content/admin/Categories')));
const UsersList = Loader(lazy(() => import('src/content/admin/Users')));
const UserDetail = Loader(lazy(() => import('src/content/admin/Users/UserDetail')));
const ReviewsList = Loader(lazy(() => import('src/content/admin/Reviews')));

// Status
const Status404 = Loader(
  lazy(() => import('src/content/pages/Status/Status404'))
);
const Status500 = Loader(
  lazy(() => import('src/content/pages/Status/Status500'))
);
const StatusMaintenance = Loader(
  lazy(() => import('src/content/pages/Status/Maintenance'))
);

const routes: RouteObject[] = [
  {
    path: '',
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/admin/dashboard" replace />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'status',
        children: [
          {
            path: '',
            element: <Navigate to="404" replace />
          },
          {
            path: '404',
            element: <Status404 />
          },
          {
            path: '500',
            element: <Status500 />
          },
          {
            path: 'maintenance',
            element: <StatusMaintenance />
          }
        ]
      },
      {
        path: '*',
        element: <Status404 />
      }
    ]
  },
  {
    path: 'admin',
    element: (
      <ProtectedRoute>
        <SidebarLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            element: <ProductsList />
          },
          {
            path: 'create',
            element: <ProductForm />
          },
          {
            path: ':productId',
            element: <ProductForm />
          }
        ]
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            element: <OrdersList />
          },
          {
            path: ':orderId',
            element: <OrderDetail />
          }
        ]
      },
      {
        path: 'categories',
        element: <CategoriesList />
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            element: <UsersList />
          },
          {
            path: ':userId',
            element: <UserDetail />
          }
        ]
      },
      {
        path: 'reviews',
        element: <ReviewsList />
      }
    ]
  }
];

export default routes;
