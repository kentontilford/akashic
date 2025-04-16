import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'

interface User {
  id: number
  name: string
  email: string
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  
  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setLoading(false)
        return
      }
      
      try {
        // Set auth token in axios headers
        axios.defaults.headers.common['x-auth-token'] = token
        
        // Get user data
        const res = await axios.get('/api/auth')
        setUser(res.data)
      } catch (err) {
        console.error('Auth error:', err)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [router.pathname])
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['x-auth-token']
    setUser(null)
    router.push('/login')
  }
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-xl">
              Akashic
            </Link>
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="text-sm opacity-75">Loading...</div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="flex items-center px-3 py-2 border rounded text-white border-white hover:text-highlight hover:border-highlight"
                >
                  <span className="mr-2">{user.name}</span>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-primary rounded-md shadow-lg py-1 z-10">
                    <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <Link href="/login" className="text-white hover:text-highlight">
                  Login
                </Link>
                <Link 
                  href="/signup"
                  className="px-3 py-2 rounded-md border border-white hover:border-highlight hover:text-highlight"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}