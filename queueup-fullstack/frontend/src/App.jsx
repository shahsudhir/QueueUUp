import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import CustomerLayout from "./components/layout/CustomerLayout";
import BusinessLayout from "./components/layout/BusinessLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import ErrorBoundary from "./components/layout/ErrorBoundary";
import ScrollToTop from "./components/layout/ScrollToTop";
import PageLoader from "./components/ui/PageLoader";

// Route-level code splitting: each page loads only when visited.
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const BusinessLogin = lazy(() => import("./pages/BusinessLogin"));
const BusinessSignup = lazy(() => import("./pages/BusinessSignup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Home = lazy(() => import("./pages/Home"));
const JoinQueue = lazy(() => import("./pages/JoinQueue"));
const TokenScreen = lazy(() => import("./pages/TokenScreen"));
const CustomerQueueStatus = lazy(() => import("./pages/CustomerQueueStatus"));
const QRJoinQueue = lazy(() => import("./pages/QRJoinQueue"));
const LiveQueue = lazy(() => import("./pages/LiveQueue"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const BusinessQR = lazy(() => import("./pages/BusinessQR"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Old single-shop customer URLs now go to the start page (customers need a shop first)
const OLD_CUSTOMER_PATHS = ["/home", "/join-queue", "/token", "/customer-status", "/qr-join", "/role-selection"];

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Start page: find a shop, or sign in / create a shop */}
                <Route path="/" element={<RoleSelection />} />
                <Route path="/business-login" element={<BusinessLogin />} />
                <Route path="/business-signup" element={<BusinessSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Customers: everything is inside one shop, chosen by its slug */}
                <Route path="/s/:slug" element={<CustomerLayout />}>
                  <Route index element={<Home />} />
                  <Route path="join" element={<JoinQueue />} />
                  <Route path="token" element={<TokenScreen />} />
                  <Route path="queue" element={<CustomerQueueStatus />} />
                  <Route path="qr" element={<QRJoinQueue />} />
                </Route>

                {/* Business (sign-in required): always the signed-in user's own shop */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<BusinessLayout />}>
                    <Route path="/business-dashboard" element={<BusinessDashboard />} />
                    <Route path="/live-queue" element={<LiveQueue />} />
                    <Route path="/business-qr" element={<BusinessQR />} />
                    <Route path="/change-password" element={<ChangePassword />} />

                    {/* Admin only */}
                    <Route element={<AdminRoute />}>
                      <Route path="/staff" element={<StaffManagement />} />
                    </Route>
                  </Route>
                </Route>

                {OLD_CUSTOMER_PATHS.map((path) => (
                  <Route key={path} path={path} element={<Navigate to="/" replace />} />
                ))}

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
