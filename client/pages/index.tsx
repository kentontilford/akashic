import Head from 'next/head'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import ProfileCard from '../components/ProfileCard'

interface Profile {
  id: number
  name: string
  prompt_template: string
}

export default function Home() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      fetchUserData(token)
    } else {
      setLoading(false)
    }
  }, [])
  
  const fetchUserData = async (token: string) => {
    try {
      // Set auth token in axios headers
      axios.defaults.headers.common['x-auth-token'] = token
      
      // Get user data
      await axios.get('/api/auth')
      
      // Fetch profiles
      fetchProfiles()
    } catch (err) {
      console.error('Auth error:', err)
      localStorage.removeItem('token')
      setIsAuthenticated(false)
      setLoading(false)
    }
  }
  
  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/profile')
      setProfiles(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load profiles. Using demo mode.')
      // Fallback to demo profiles
      setProfiles([
        { id: 1, name: 'The Mirror', prompt_template: 'Reflect this to the user: {{input}}' },
        { id: 2, name: 'The Strategist', prompt_template: 'Guide decisively: {{input}}' }
      ])
    } finally {
      setLoading(false)
    }
  }
  
  const handleProfileSelect = async (profile: Profile) => {
    try {
      // Create a new conversation with this profile
      const response = await axios.post('/api/conversation', {
        title: `Conversation with ${profile.name}`,
        profile_id: profile.id
      })
      
      // Redirect to the conversation page
      router.push(`/conversation/${response.data.id}`)
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setError('Failed to create conversation. Please try again.')
    }
  }
  
  const handleLogin = () => {
    router.push('/login')
  }
  
  const handleSignup = () => {
    router.push('/signup')
  }

  return (
    <>
      <Head>
        <title>Akashic</title>
        <meta name="description" content="Your AI assistant workspace" />
      </Head>
      <main className="min-h-screen bg-secondary text-primary flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Akashic</h1>
        <p className="text-lg mb-8">Your AI assistant workspace</p>
        
        {loading ? (
          <div className="text-center">
            <p>Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center">
            <p className="mb-4">Please login or sign up to continue</p>
            <div className="flex gap-4">
              <button 
                onClick={handleLogin}
                className="px-6 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleSignup}
                className="px-6 py-2 border border-accent text-accent rounded hover:bg-accent/10 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded mb-4 w-full max-w-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {profiles.map(profile => (
                <ProfileCard 
                  key={profile.id} 
                  profile={profile} 
                  onSelect={handleProfileSelect} 
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}