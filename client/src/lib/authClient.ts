/**
 * Relative by default, so the API is same-origin: Vite proxies /api in dev and
 * lunonote.com/api serves it in production. That keeps the session cookie
 * usable (a cross-origin call could not send it, since CORS runs with
 * credentials disabled). Override only to point at a different backend.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '/api';

class AuthClient {

  login(email: string, password: string): Promise<void> {
    return fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Sign-in failed');
      }
      return response.json();
    });
  }

  register(email: string, password: string): Promise<void> {
    return fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Sign-up failed');
      }
      return response.json();
    });
  }

  getCurrentUser(): Promise<{ id: string; email: string } | null> {
    return fetch(`${BACKEND_URL}/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    });
  }

  logout(): Promise<void> {
    return fetch(`${BACKEND_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    });
  }

}


export const authClient = new AuthClient();

if(import.meta.env.DEV) {
  // Expose the auth client to the console for testing.
  (window as any).authClient = authClient
}