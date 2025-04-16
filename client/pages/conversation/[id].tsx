import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import axios from 'axios'
import Link from 'next/link'

interface Message {
  id: number
  content: string
  role: string
  created_at: string
}

interface Conversation {
  id: number
  title: string
  profile_id: number
  profile_name: string
  prompt_template: string
  messages: Message[]
  created_at: string
  updated_at: string
}

export default function ConversationPage() {
  const router = useRouter()
  const { id } = router.query
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    // Set auth token in axios headers
    axios.defaults.headers.common['x-auth-token'] = token
    
    // Fetch conversation if id is available
    if (id) {
      fetchConversation()
    }
  }, [id, router])
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])
  
  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/conversation/${id}`)
      setConversation(response.data)
      setError('')
    } catch (err: any) {
      console.error('Failed to fetch conversation:', err)
      setError(err.response?.data?.message || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return
    
    try {
      setSending(true)
      
      // Optimistically add user message to UI
      const newUserMessage: Message = {
        id: Date.now(), // temporary id
        content: message,
        role: 'user',
        created_at: new Date().toISOString()
      }
      
      setConversation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [...prev.messages, newUserMessage]
        }
      })
      
      // Clear the input
      setMessage('')
      
      // Send message to API
      const response = await axios.post(`/api/conversation/${id}/messages`, {
        content: message,
        role: 'user'
      })
      
      // Update with actual messages from response
      if (response.data.aiMessage) {
        setConversation(prev => {
          if (!prev) return prev
          
          // Replace the temp message with the actual one and add AI response
          const filteredMessages = prev.messages.filter(msg => msg.id !== newUserMessage.id)
          return {
            ...prev,
            messages: [
              ...filteredMessages, 
              response.data.userMessage,
              response.data.aiMessage
            ]
          }
        })
      }
    } catch (err: any) {
      console.error('Failed to send message:', err)
      setError(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <p>Loading conversation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-accent text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{conversation?.title || 'Conversation'} | Akashic</title>
      </Head>
      
      <div className="flex flex-col h-screen bg-secondary text-primary">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{conversation?.title}</h1>
            <p className="text-sm text-gray-500">Profile: {conversation?.profile_name}</p>
          </div>
          
          <Link href="/" className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors">
            Back to Home
          </Link>
        </header>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-3xl ${
                msg.role === 'user' ? 'ml-auto bg-accent/10' : 'mr-auto bg-white'
              } rounded-lg p-4 shadow-sm`}
            >
              <div className="flex items-center mb-2">
                <div className="font-bold">
                  {msg.role === 'user' ? 'You' : conversation.profile_name}
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
              <div className="whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          ))}
          
          {sending && (
            <div className="max-w-3xl mr-auto bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="font-bold">{conversation?.profile_name}</div>
              </div>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="bg-white p-4 shadow-inner">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={sending}
            />
            <button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={sending || !message.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  )
}