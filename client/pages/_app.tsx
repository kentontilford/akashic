import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

// Configure axios base URL
if (typeof window !== 'undefined') {
  // Use environment variable for API URL in production
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
}

export default function App({ Component, pageProps }: AppProps) {
  // Set auth token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token
    }
  }, [])

  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  )
}
