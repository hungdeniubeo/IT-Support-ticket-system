import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { getAccessState } from './auth/access'
import { ToastProvider } from './components/ToastProvider'
import { LoadingScreen } from './components/LoadingScreen'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((module) => ({ default: module.KnowledgePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const TicketCreatePage = lazy(() => import('./pages/TicketCreatePage').then((module) => ({ default: module.TicketCreatePage })))
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage').then((module) => ({ default: module.TicketDetailPage })))
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((module) => ({ default: module.TicketsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))

function page(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen label="Đang tải giao diện…" />}>{element}</Suspense>
}

export { getAccessState }

const router = createBrowserRouter([
  { path: '/login', element: page(<LoginPage />) },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: page(<DashboardPage />) },
        { path: 'tickets', element: page(<TicketsPage />) },
        { path: 'tickets/new', element: page(<TicketCreatePage />) },
        { path: 'tickets/:ticketNumber', element: page(<TicketDetailPage />) },
        { path: 'knowledge', element: page(<KnowledgePage />) },
        { path: 'settings', element: page(<SettingsPage />) },
        { path: '*', element: page(<NotFoundPage />) },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export function App() {
  return <AuthProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></AuthProvider>
}
