import React, { useState } from 'react'
import { supabase } from '../supabase/client'
import { upsertProfile } from '../services/api'

type Props = {
  open: boolean
  onClose: () => void
  onSignedIn?: (email?: string) => void
}

export const AuthModal: React.FC<Props> = ({ open, onClose, onSignedIn }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        const defaultName = email.split('@')[0] || 'player'
        try {
          await upsertProfile({ username: defaultName })
        } catch {}
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
      onSignedIn?.(email)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w满 max-w-sm bg-game-board border border-game-grid rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{mode === 'signin' ? '登录' : '注册'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('signin')}
            className={`px-3 py-1 rounded text-sm ${mode === 'signin' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}
          >登录</button>
          <button
            onClick={() => setMode('signup')}
            className={`px-3 py-1 rounded text-sm ${mode === 'signup' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}
          >注册</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-200"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >{loading ? '处理中...' : mode === 'signin' ? '登录' : '注册并登录'}</button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
