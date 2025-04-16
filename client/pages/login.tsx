import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import axios from 'axios'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { email, password } = formData

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      
      const res = await axios.post('/api/auth', formData)
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token)
      
      // Set axios default headers
      axios.defaults.headers.common['x-auth-token'] = res.data.token
      
      // Redirect to dashboard
      router.push('/')
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials.'
      )
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login | Akashic</title>
      </Head>
      <main className="min-h-screen bg-secondary flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center text-primary mb-6">Login to Akashic</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-primary text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-accent"
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Email"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-primary text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-accent"
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                className="bg-accent hover:bg-accent/90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              
              <Link href="/signup" className="inline-block align-baseline font-bold text-sm text-accent hover:text-accent/80">
                Create an account
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}