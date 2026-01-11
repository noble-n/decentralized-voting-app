"use client"

interface Candidate {
  id: string
  name: string
  votes: number
}

interface VotingChartProps {
  candidates: Candidate[]
}

const chartColors = ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af"]

export default function VotingChart({ candidates }: VotingChartProps) {
  // Handle empty candidates array
  if (candidates.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm">No votes recorded yet</p>
      </div>
    )
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)

  const leader = candidates.reduce((prev, current) =>
    (current.votes > prev.votes ? current : prev)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        {candidates.map((candidate, index) => {
          const percentage = totalVotes > 0
            ? ((candidate.votes / totalVotes) * 100).toFixed(1)
            : "0.0"
          const isLeading = candidate.id === leader.id

          return (
            <div key={candidate.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isLeading ? "text-gray-900 font-bold" : "text-gray-600"}`}>
                  {candidate.name.split(" ")[0]}
                </span>
                <span className="text-sm font-semibold text-gray-900">{candidate.votes}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                />
              </div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Currently Leading</p>
          {totalVotes === 0 ? (
            <p className="font-bold text-gray-900">No Record</p>
          ) : (
            <>
              <p className="font-bold text-gray-900">{leader.name}</p>
              <p className="text-sm text-gray-600">{leader.votes} votes</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}