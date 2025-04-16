import React from 'react'

interface Profile {
  id: number
  name: string
  prompt_template: string
}

interface ProfileCardProps {
  profile: Profile
  onSelect: (profile: Profile) => void
}

export default function ProfileCard({ profile, onSelect }: ProfileCardProps) {
  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-2">{profile.name}</h2>
      <p className="text-gray-600 mb-4 line-clamp-2">{profile.prompt_template}</p>
      <button 
        className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
        onClick={() => onSelect(profile)}
      >
        Start Conversation
      </button>
    </div>
  )
}