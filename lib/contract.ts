import { ethers } from "ethers"

export const CONTRACT_ADDRESS = "0xC9e2a74607469d3925F7E630B2F7039F7e07f6ab"

export const CONTRACT_ABI = [
    { "inputs": [{ "internalType": "uint256", "name": "_startTime", "type": "uint256" }, { "internalType": "uint256", "name": "_endTime", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "Voting__AlreadyVoted", "type": "error" }, { "inputs": [], "name": "Voting__InvalidOption", "type": "error" }, { "inputs": [], "name": "Voting__InvalidTimeframe", "type": "error" }, { "inputs": [], "name": "Voting__NotOwner", "type": "error" }, { "inputs": [], "name": "Voting__VotingAlreadyStarted", "type": "error" }, { "inputs": [], "name": "Voting__VotingClosed", "type": "error" }, { "inputs": [], "name": "Voting__VotingNotStarted", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "name", "type": "string" }, { "indexed": true, "internalType": "bytes32", "name": "optionId", "type": "bytes32" }], "name": "OptionAdded", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "voter", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "optionId", "type": "bytes32" }], "name": "VoteCast", "type": "event" }, { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }], "name": "addOption", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "optionId", "type": "bytes32" }], "name": "castVote", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getNumOptions", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getOptions", "outputs": [{ "components": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "bytes32", "name": "id", "type": "bytes32" }, { "internalType": "bool", "name": "exists", "type": "bool" }], "internalType": "struct Voting.Option[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "optionId", "type": "bytes32" }], "name": "getVotes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "hasVoted", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "i_endTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "i_startTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "votes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
]

export async function getContract(needsSigner = false) {
    if (!window.ethereum) {
        throw new Error("MetaMask not installed")
    }

    const provider = new ethers.BrowserProvider(window.ethereum)

    // For read-only operations, we don't need a signer
    if (!needsSigner) {
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    }

    // Only request signer for write operations
    const signer = await provider.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

// Add these to your contract.ts file

export async function addVotingOption(optionName: string) {
  const contract = await getContract(true)
  const tx = await contract.addOption(optionName)
  await tx.wait()
  return tx
}

export async function getVotingOptions() {
  const contract = await getContract(false)
  const options = await contract.getOptions()
  
  return await Promise.all(
    options.map(async (opt: any) => {
      const votes = await contract.getVotes(opt.id)
      return {
        name: opt.name,
        id: opt.id,
        exists: opt.exists,
        votes: Number(votes)
      }
    })
  )
}

export async function getVotingStatus() {
  const contract = await getContract(false)
  const [startTime, endTime, numOptions, owner] = await Promise.all([
    contract.i_startTime(),
    contract.i_endTime(),
    contract.getNumOptions(),
    contract.getOwner()
  ])
  
  const now = Math.floor(Date.now() / 1000)
  const start = Number(startTime)
  const end = Number(endTime)
  
  return {
    startTime: start,
    endTime: end,
    numOptions: Number(numOptions),
    owner: owner,
    hasStarted: now >= start,
    hasEnded: now >= end,
    isActive: now >= start && now < end,
    canAddOptions: now < start
  }
}

export async function checkIfOwner(userAddress: string) {
  const contract = await getContract(false)
  const owner = await contract.getOwner()
  return owner.toLowerCase() === userAddress.toLowerCase()
}