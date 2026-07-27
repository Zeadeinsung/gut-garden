import { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    await login(phone, code)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--color-garden-brown)' }}>
          肠道花园
        </h1>
        <input
          className="w-full border rounded-lg px-4 py-2 mb-3"
          placeholder="手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="验证码"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm whitespace-nowrap">发送验证码</button>
        </div>
        <button
          className="w-full py-2 rounded-lg text-white font-bold"
          style={{ background: 'var(--color-garden-green)' }}
          onClick={handleLogin}
        >
          登录
        </button>
      </div>
    </div>
  )
}
