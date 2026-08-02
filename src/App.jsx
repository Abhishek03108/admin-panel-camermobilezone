import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";

import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import BrandsPage from "./pages/brands/BrandsPage.jsx";

import ProductsListPage from "./pages/products/ProductsListPage.jsx";
import ProductFormPage from "./pages/products/ProductFormPage.jsx";

import ReviewsPage from "./pages/reviews/ReviewsPage.jsx";
import CuratedListsPage from "./pages/curated/CuratedListsPage.jsx";

import OrdersListPage from "./pages/orders/OrdersListPage.jsx";
import OrderDetailPage from "./pages/orders/OrderDetailPage.jsx";

import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import DeliveriesPage from "./pages/deliveries/DeliveriesPage.jsx";

import UsersListPage from "./pages/users/UsersListPage.jsx";
import UserDetailPage from "./pages/users/UserDetailPage.jsx";

import ContactMessagesPage from "./pages/contact/ContactMessagesPage.jsx";
import NewsletterPage from "./pages/newsletter/NewsletterPage.jsx";
import ContentPage from "./pages/content/ContentPage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";

import Scan from "./pages/auth/Scan.jsx";
import QrLogin from "./pages/auth/QrLogin.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/login/qr" element={<QrLogin />} />
<Route path="/scan" element={<Scan />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />

        <Route path="payments" element={<PaymentsPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />

        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />

        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="curated" element={<CuratedListsPage />} />

        <Route path="users" element={<UsersListPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />

        <Route path="contact-messages" element={<ContactMessagesPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="content" element={<ContentPage />} />

        <Route path="settings" element={<SettingsPage />} />

        
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
