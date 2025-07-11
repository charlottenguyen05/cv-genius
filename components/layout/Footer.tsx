import React from 'react'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white/10 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <FileText className="w-6 h-6" />
            <span className="text-lg font-semibold">CV Genius</span>
          </div>

          <div className="flex space-x-6">
            <Link
              href="/about"
              className="text-gray-400 hover:text-white transition-colors"
            >
              À propos
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Conditions
            </Link>
            <Link href="/docs" className="text-gray-400 hover:text-white">
              Documentation
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white">
              Support
            </Link>
          </div>
        </div>

        <div className="border-t border-white/30 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; 2024 CV Genius. Projet pédagogique - Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
} 