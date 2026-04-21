import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext.jsx'
import { consumeOAuthVerifier, getStoredOAuthState } from '../../services/oauth'

export default function PortalOAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithOAuth } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    async function completeFlow() {
      const oauthError = searchParams.get('error')
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const expectedState = getStoredOAuthState()

      if (oauthError) {
        setError('La autorización OAuth2 fue cancelada o rechazada.')
        return
      }

      if (!code || !state || state !== expectedState) {
        setError('Respuesta OAuth2 inválida (state o code incorrecto).')
        return
      }

      const verifier = consumeOAuthVerifier()
      if (!verifier) {
        setError('No se encontró PKCE verifier. Inicia sesión de nuevo.')
        return
      }

      try {
        await loginWithOAuth(code, verifier)
        toast.success('Sesión OAuth2 iniciada')
        navigate('/portal/catalog', { replace: true })
      } catch {
        setError('No fue posible completar el inicio de sesión OAuth2.')
      }
    }

    completeFlow()
  }, [searchParams, loginWithOAuth, navigate])

  return (
    <div className="portal-root min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card-portal w-full max-w-lg text-center">
        {!error ? (
          <>
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Completando acceso OAuth2</h1>
            <p className="text-slate-500 text-sm">Estamos validando tu autorización...</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-red-600 mb-2">Error de OAuth2</h1>
            <p className="text-slate-600 text-sm mb-4">{error}</p>
            <button className="btn-portal" onClick={() => navigate('/portal/login', { replace: true })}>
              Volver a iniciar sesión
            </button>
          </>
        )}
      </div>
    </div>
  )
}
