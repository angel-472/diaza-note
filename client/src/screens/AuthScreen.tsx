import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { authClient } from 'src/lib/authClient'

type Mode = 'signin' | 'signup'

/**
 * Presentation only. The fields hold their own text and nothing else happens
 * yet — submitting is a no-op.
 * PLUG IN: `POST /auth/signin` and `POST /auth/signup`, then hand the session
 * up to App (a signal, or a prop callback) so it can swap off this screen.
 */
export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isSignUp = mode === 'signup'
  // Only complain once there is something to compare against, so the message
  // does not appear while the second field is still being typed into.
  const isMismatched = isSignUp && confirmPassword.length > 0 && confirmPassword !== password
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!isSignUp || (confirmPassword.length > 0 && confirmPassword === password))

  
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // PLUG IN: call the auth endpoint for `mode` here.
    console.log(event)
    if(mode === 'signin') {
      authClient.login(email, password).then(() => {
        console.log('Login successful')
      })
      .catch((error) => {
        console.error(error)
      })
    } else {
      authClient.register(email, password).then(() => {
        console.log('Registration successful')
      })
      .catch((error) => {
        console.error(error)
      })
    }
  }

  // 
  // RENDERING
  // 
  return (
    <div className="flex h-dvh flex-col bg-zinc-900">
      <div className="flex flex-1 flex-col justify-center overflow-y-auto">
        <div className="mx-auto w-full max-w-sm px-4 py-10 sm:px-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Luno Note
          </h1>
          <p className="pt-2 pb-6 text-base text-zinc-500">
            {isSignUp ? 'Create an account to keep your notes.' : 'Sign in to reach your notes.'}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit(event);
            }}
          >
            {/* Same grouped-rows treatment as the category and note lists. */}
            <div className="overflow-hidden rounded-xl bg-zinc-900">
              <label className="flex items-center gap-3 px-4 py-3">
                <Mail className="size-5 shrink-0 text-cyan-400" strokeWidth={2} />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="min-w-0 flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </label>

              <div className="ml-12 border-b border-zinc-800" />

              <label className="flex items-center gap-3 px-4 py-3">
                <Lock className="size-5 shrink-0 text-cyan-400" strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="min-w-0 flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 active:bg-zinc-800"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </label>

              {/* The eye toggle above reveals both fields, so this row has none. */}
              {isSignUp && (
                <>
                  <div className="ml-12 border-b border-zinc-800" />
                  <label className="flex items-center gap-3 px-4 py-3">
                    <Lock className="size-5 shrink-0 text-cyan-400" strokeWidth={2} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm password"
                      className="min-w-0 flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500"
                    />
                  </label>
                </>
              )}
            </div>

            {isMismatched && (
              <p className="px-1 pt-2 text-sm text-red-400">Passwords do not match.</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full rounded-lg bg-cyan-400 py-3 text-base font-semibold text-zinc-900 active:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="flex justify-center pt-5">
            <button
              type="button"
              onClick={() => {
                // Dropped on the way out so a stale value cannot block the
                // button the next time sign up is opened.
                setConfirmPassword('')
                setMode(isSignUp ? 'signin' : 'signup')
              }}
              className="rounded-lg px-2 py-1 text-base text-cyan-400 active:bg-zinc-900"
            >
              {isSignUp ? 'I already have an account' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}