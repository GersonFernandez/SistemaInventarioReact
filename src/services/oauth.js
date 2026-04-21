import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const OAUTH_AUTHORIZE_URL = import.meta.env.VITE_OAUTH_AUTHORIZE_URL || '/api/v1/oauth/authorize/'
const OAUTH_TOKEN_URL = import.meta.env.VITE_OAUTH_TOKEN_URL || '/api/v1/oauth/token/'
const OAUTH_REVOKE_URL = import.meta.env.VITE_OAUTH_REVOKE_URL || '/api/v1/oauth/revoke_token/'
const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || ''
const OAUTH_REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/portal/oauth/callback`
const OAUTH_SCOPE = import.meta.env.VITE_OAUTH_SCOPE || 'read write'

function toBase64Url(uint8Array) {
  const str = btoa(String.fromCharCode(...uint8Array))
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

function randomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const arr = new Uint8Array(length)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, (x) => chars[x % chars.length]).join('')
}

export async function buildOAuthAuthorizationUrl() {
  if (!OAUTH_CLIENT_ID) {
    throw new Error('Falta VITE_OAUTH_CLIENT_ID en el frontend.')
  }

  const codeVerifier = randomString(96)
  const codeChallengeBytes = await sha256(codeVerifier)
  const codeChallenge = toBase64Url(codeChallengeBytes)
  const state = randomString(48)

  localStorage.setItem('oauth_pkce_verifier', codeVerifier)
  localStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: OAUTH_SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

export function getStoredOAuthState() {
  return localStorage.getItem('oauth_state')
}

export function consumeOAuthVerifier() {
  const verifier = localStorage.getItem('oauth_pkce_verifier')
  localStorage.removeItem('oauth_pkce_verifier')
  localStorage.removeItem('oauth_state')
  return verifier
}

export async function exchangeOAuthCodeForToken(code, verifier) {
  const formData = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    code_verifier: verifier,
  })

  const { data } = await axios.post(OAUTH_TOKEN_URL, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  const access = data.access_token
  const refresh = data.refresh_token

  if (!access) {
    throw new Error('No se recibió access_token desde OAuth2.')
  }

  const me = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${access}` },
  })

  return {
    access,
    refresh: refresh || null,
    user: me.data,
  }
}

export async function revokeOAuthToken(token, tokenTypeHint = 'refresh_token') {
  if (!token || !OAUTH_CLIENT_ID) return
  const formData = new URLSearchParams({
    token,
    token_type_hint: tokenTypeHint,
    client_id: OAUTH_CLIENT_ID,
  })
  await axios.post(OAUTH_REVOKE_URL, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
