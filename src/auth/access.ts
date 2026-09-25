export function getAccessState(state: {
  loading: boolean
  configured: boolean
  development: boolean
  authenticated: boolean
}): 'loading' | 'configuration' | 'login' | 'application' | 'local-development' {
  if (state.loading) return 'loading'
  if (!state.configured) return state.development ? 'local-development' : 'configuration'
  return state.authenticated ? 'application' : 'login'
}
