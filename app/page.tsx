"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import VotingChart from "@/components/voting-chart"
import SuccessModal from "@/components/success-modal"
import { getContract } from "@/lib/contract"

interface Candidate {
  id: string
  name: string
  image: string
  votes: number
}

export default function VotingApp() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successName, setSuccessName] = useState("")
  const [canVote, setCanVote] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)


  // Check if wallet is already connected on mount
  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  // Poll for updates only if connected
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      loadFromChain()
      checkVotingWindow()
    }, 10000)
    return () => clearInterval(interval)
  }, [isConnected])

  async function checkIfWalletIsConnected() {
    if (!window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length > 0) {
        setIsConnected(true)
        await loadFromChain()
        await checkVotingWindow()
      }
    } catch (err) {
      console.error("Failed to check wallet connection:", err)
    }
  }


  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask first")

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      setIsConnected(true)
      await loadFromChain()
      await checkVotingWindow()
    } catch (err: any) {
      alert(err.message || "Failed to connect wallet")
    }
  }

  async function checkVotingWindow() {
    try {
      const contract = await getContract(false)
      const start = Number(await contract.i_startTime())
      const end = Number(await contract.i_endTime())
      const now = Math.floor(Date.now() / 1000)

      setStartTime(start)
      setEndTime(end)
      setCanVote(now >= start && now <= end)
    } catch (err) {
      console.error("Failed to check voting window:", err)
    }
  }

  async function loadFromChain() {
    try {
      const contract = await getContract(false) // Read-only
      const options = await contract.getOptions()

      const data = await Promise.all(
        options.map(async (opt: any) => {
          const votes = await contract.getVotes(opt.id)
          return {
            id: opt.id,
            name: opt.name,
            image: "/placeholder.svg",
            votes: Number(votes),
          }
        })
      )

      setCandidates(data)
    } catch (err) {
      console.error("Failed to load from chain:", err)
    }
  }
  const handleVote = async () => {
    if (!selectedCandidate) return

    try {
      const contract = await getContract(true) // Needs signer for writing
      const tx = await contract.castVote(selectedCandidate)
      await tx.wait()

      const votedCandidate = candidates.find(c => c.id === selectedCandidate)
      setSuccessName(votedCandidate?.name || "")
      setShowSuccess(true)
      setSelectedCandidate(null)

      await loadFromChain()

      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err: any) {
      alert(err.reason || err.message || "Vote failed")
    }
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Blockchain Elections</h1>
        <p className="text-lg text-gray-600">Vote on the decentralized network</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Voting Section */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Candidate</h2>

                {!isConnected ? (
                  <div className="text-center mt-10">
                    <Button onClick={connectWallet} className="px-8 py-6 text-lg">
                      Connect Wallet
                    </Button>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center mt-10">
                    <p className="text-gray-600">Loading candidates...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => setSelectedCandidate(candidate.id)}
                        className="group focus:outline-none transition-transform hover:scale-105"
                      >
                        <Card
                          className={`relative overflow-hidden cursor-pointer transition-all ${selectedCandidate === candidate.id
                            ? "ring-4 ring-gray-900 shadow-xl"
                            : "hover:shadow-lg"
                            }`}
                        >
                          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <img
                              src={candidate.image}
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 text-center bg-white">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {candidate.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {candidate.votes} votes
                            </p>
                          </div>
                          {selectedCandidate === candidate.id && (
                            <div className="absolute top-2 right-2 bg-gray-900 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </Card>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vote Button */}
              {isConnected && (
                <>
                  <div className="flex gap-4 justify-center mb-8">
                    <Button
                      onClick={handleVote}
                      disabled={!selectedCandidate || !canVote}
                      className="px-8 py-6 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {(() => {
                        if (!canVote) {
                          const now = Math.floor(Date.now() / 1000)
                          return now < startTime ? "Voting Not Started" : "Voting Closed"
                        }
                        return "Cast Vote"
                      })()}
                    </Button>
                    {selectedCandidate && (
                      <Button
                        onClick={() => setSelectedCandidate(null)}
                        variant="outline"
                        className="px-8 py-6 text-lg rounded-full font-semibold"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Total Votes Info */}
                  <div className="text-center">
                    <p className="text-gray-600">
                      <span className="font-bold text-gray-900 text-lg">{totalVotes}</span> votes recorded on the blockchain
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Results Chart Section */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Results</h2>
              <Card className="p-6 shadow-lg">
                <VotingChart candidates={candidates} />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && <SuccessModal candidateName={successName} />}
    </main>
  )
}