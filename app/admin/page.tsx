"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getContract } from "@/lib/contract"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPage() {
    const [optionName, setOptionName] = useState("")
    const [options, setOptions] = useState<any[]>([])
    const [isOwner, setIsOwner] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [votingStatus, setVotingStatus] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [checkingOwnership, setCheckingOwnership] = useState(true)

    useEffect(() => {
        checkOwnership()
        loadOptions()
        loadVotingStatus()
    }, [])

    async function checkOwnership() {
        setCheckingOwnership(true)
        try {
            if (!window.ethereum) return

            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            if (accounts.length === 0) return

            setIsConnected(true)
            const contract = await getContract(false)
            const owner = await contract.getOwner()
            const userAddress = accounts[0]

            setIsOwner(owner.toLowerCase() === userAddress.toLowerCase())
        } catch (err) {
            console.error("Failed to check ownership:", err)
        } finally {
            setCheckingOwnership(false)
        }
    }

    async function loadOptions() {
        try {
            const contract = await getContract(false)
            const opts = await contract.getOptions()
            setOptions(opts)
        } catch (err) {
            console.error("Failed to load options:", err)
        }
    }

    async function loadVotingStatus() {
        try {
            const contract = await getContract(false)
            const start = Number(await contract.i_startTime())
            const end = Number(await contract.i_endTime())
            const now = Math.floor(Date.now() / 1000)

            setVotingStatus({
                startTime: new Date(start * 1000).toLocaleString(),
                endTime: new Date(end * 1000).toLocaleString(),
                hasStarted: now >= start,
                hasEnded: now >= end,
                canAddOptions: now < start
            })
        } catch (err) {
            console.error("Failed to load voting status:", err)
        }
    }

    async function handleAddOption() {
        if (!optionName.trim()) {
            alert("Please enter a candidate name")
            return
        }

        setLoading(true)
        try {
            const contract = await getContract(true)
            const tx = await contract.addOption(optionName.trim())
            await tx.wait()

            alert(`Successfully added: ${optionName}`)
            setOptionName("")
            await loadOptions()
        } catch (err: any) {
            console.error("Failed to add option:", err)

            if (err.message.includes("Voting__NotOwner")) {
                alert("Only the contract owner can add options")
            } else if (err.message.includes("Voting__VotingAlreadyStarted")) {
                alert("Cannot add options after voting has started")
            } else {
                alert(err.reason || err.message || "Failed to add option")
            }
        } finally {
            setLoading(false)
        }
    }

    async function connectWallet() {
        setCheckingOwnership(true)
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
            await checkOwnership()
            await loadOptions()
            await loadVotingStatus()
        } catch (err: any) {
            alert(err.message || "Failed to connect wallet")
        } finally {
            setCheckingOwnership(false)
        }
    }

    if (checkingOwnership) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking permissions...</p>
                    </div>
                </Card>
            </main>
        )
    }

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
                    <Button onClick={connectWallet} className="w-full">
                        Connect Wallet
                    </Button>
                </Card>
            </main>
        )
    }

    if (!isOwner) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
                    <p className="text-gray-600">Only the contract owner can access this page.</p>
                </Card>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Panel</h1>

                {/* Voting Status */}
                {votingStatus && (
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Voting Period</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>Start:</strong> {votingStatus.startTime}</p>
                            <p><strong>End:</strong> {votingStatus.endTime}</p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span className={votingStatus.hasEnded ? "text-red-600" : votingStatus.hasStarted ? "text-green-600" : "text-yellow-600"}>
                                    {votingStatus.hasEnded ? "Ended" : votingStatus.hasStarted ? "Active" : "Not Started"}
                                </span>
                            </p>
                        </div>
                    </Card>
                )}

                {/* Add Option Form */}
                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Add Voting Option</h2>

                    {votingStatus && !votingStatus.canAddOptions && (
                        <Alert className="mb-4">
                            <AlertDescription>
                                Options cannot be added after voting has started.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-4">
                        <Input
                            type="text"
                            placeholder="Candidate name"
                            value={optionName}
                            onChange={(e) => setOptionName(e.target.value)}
                            disabled={loading || (votingStatus && !votingStatus.canAddOptions)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                        />
                        <Button
                            onClick={handleAddOption}
                            disabled={loading || !optionName.trim() || (votingStatus && !votingStatus.canAddOptions)}
                        >
                            {loading ? "Adding..." : "Add Option"}
                        </Button>
                    </div>
                </Card>

                {/* Current Options */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Current Options ({options.length})</h2>
                    {options.length === 0 ? (
                        <p className="text-gray-500">No options added yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {options.map((opt, idx) => (
                                <li key={idx} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                                    <span className="font-medium">{opt.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {opt.id.slice(0, 10)}...
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </main>
    )
}