"use client"

import { CheckCircle2 } from "lucide-react"

interface SuccessModalProps {
  candidateName: string
}

export default function SuccessModal({ candidateName }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-auto text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Recorded!</h2>

        <p className="text-gray-600 mb-4">
          Your vote for <span className="font-bold text-gray-900">{candidateName}</span> has been successfully recorded
          on the blockchain.
        </p>

        <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Transaction verified and immutable</p>
          <p className="text-xs text-gray-500 mt-1">on the distributed network</p>
        </div>

        <p className="text-sm text-gray-500">Thank you for participating in the election</p>
      </div>
    </div>
  )
}
