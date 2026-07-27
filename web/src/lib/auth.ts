// Autenticación con AWS Cognito (User Pool público, sin secreto → apto para SPA).
// La contraseña se verifica EN Cognito; aquí solo la enviamos por HTTPS y guardamos
// el token resultante. Valores públicos del despliegue (no son secretos).

const REGION = 'us-east-1'
const CLIENT_ID = '4ojm2gfl880md39bkfhqoc4th8'
const IDP_URL = `https://cognito-idp.${REGION}.amazonaws.com/`

/** Base de la API (stage v1) para las llamadas del dashboard. */
export const API_BASE_URL = 'https://80mu8trlrl.execute-api.us-east-1.amazonaws.com/v1'

const SESSION_KEY = 'kandace-session'

export interface Session {
  idToken: string
  email: string
  organizationId: string
}

/** Inicia sesión contra Cognito (USER_PASSWORD_AUTH). Lanza Error con mensaje amigable si falla. */
export async function signIn(email: string, password: string): Promise<Session> {
  const res = await fetch(IDP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.AuthenticationResult?.IdToken) {
    throw new Error(friendlyError(String(data?.__type ?? ''), String(data?.message ?? '')))
  }

  const idToken: string = data.AuthenticationResult.IdToken
  const claims = decodeJwt(idToken)
  const session: Session = {
    idToken,
    email: claims['email'] ?? email,
    organizationId: claims['custom:organization_id'] ?? '',
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function signOut(): void {
  window.sessionStorage.removeItem(SESSION_KEY)
}

function decodeJwt(token: string): Record<string, string> {
  try {
    const part = token.split('.')[1]
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    return JSON.parse(atob(b64)) as Record<string, string>
  } catch {
    return {}
  }
}

function friendlyError(type: string, message: string): string {
  if (type.includes('NotAuthorized')) return 'Correo o contraseña incorrectos.'
  if (type.includes('UserNotFound')) return 'No existe una cuenta con ese correo.'
  if (type.includes('UserNotConfirmed')) return 'La cuenta aún no está confirmada.'
  if (type.includes('PasswordResetRequired')) return 'Debes restablecer tu contraseña.'
  if (type.includes('TooManyRequests') || type.includes('LimitExceeded')) return 'Demasiados intentos. Espera un momento.'
  return message || 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.'
}
