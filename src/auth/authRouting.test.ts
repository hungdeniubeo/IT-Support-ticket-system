import { describe, expect, it } from 'vitest'
import * as appModule from '../App'

type AccessState = 'loading' | 'configuration' | 'login' | 'application' | 'local-development'
const getAccessState = (appModule as typeof appModule & {
  getAccessState?: (state: { loading: boolean; configured: boolean; development: boolean; authenticated: boolean }) => AccessState
}).getAccessState

describe('protected route access', () => {
  it('waits for session restoration before deciding whether to show protected content', () => {
    expect(getAccessState).toBeTypeOf('function')
    if (!getAccessState) return

    expect(getAccessState({ loading: true, configured: true, development: false, authenticated: false })).toBe('loading')
  })

  it('routes cloud users to login and only permits local mode during development', () => {
    expect(getAccessState).toBeTypeOf('function')
    if (!getAccessState) return

    expect(getAccessState({ loading: false, configured: true, development: false, authenticated: false })).toBe('login')
    expect(getAccessState({ loading: false, configured: false, development: false, authenticated: false })).toBe('configuration')
    expect(getAccessState({ loading: false, configured: false, development: true, authenticated: false })).toBe('local-development')
    expect(getAccessState({ loading: false, configured: true, development: false, authenticated: true })).toBe('application')
  })
})
