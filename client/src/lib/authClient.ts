const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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