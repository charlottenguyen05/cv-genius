'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface AuthPopUpProps {
  isOpen: boolean
  onClose: () => void
}

const AuthPopUp: React.FC<AuthPopUpProps> = ({ isOpen, onClose }) => {
  const router = useRouter()

  if (!isOpen) return null

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleSignUp = () => {
    router.push('/register')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentification requise
          </h2>
          <p className="text-gray-600 mb-8">
            Vous devez être connecté pour continuer et soumettre votre CV. 
            Veuillez vous connecter ou créer un compte pour accéder à cette fonctionnalité.
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleSignIn}
              className="w-full"
              size="lg"
            >
              Se connecter
            </Button>
            
            <Button
              onClick={handleSignUp}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Créer un compte
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPopUp 