import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthProvider'
import { getAccessState } from './access'
import { ConfigNotice } from '../components/ConfigNotice'
import { LoadingScreen } from '../components/LoadingScreen'

export function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()
  const access = getAccessState({
    loading: auth.loading,
    configured: auth.configured,
    development: import.meta.env.DEV,
    authenticated: Boolean(auth.session),
  })

  if (access === 'loading') return <LoadingScreen />
  if (access === 'configuration') return <ConfigNotice fullPage />
  if (access === 'login') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
