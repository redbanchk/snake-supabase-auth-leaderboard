import React from 'react'
import type { Tables } from '../supabase/types'

type Props = {
  items: Tables<'leaderboard_global'>[]
  currentUserId?: string | null
}

export const Leaderboard: React.FC<Props> = ({ items, currentUserId }) => {
  return (
    <div className="w-64 bg-game-board p-3 rounded-xl border border-game-grid shadow-lg">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Global Top</span>
        <span className="text-xs text-gray-500">Top 10</span>
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((row, idx) => (
          <li key={`${row.user_id}-${idx}`} className="flex justify-between text-sm text-gray-300">
            <span className={currentUserId && row.user_id === currentUserId ? 'font-semibold text-white' : ''}>{row.username ?? (row.user_id ? row.user_id.slice(0, 6) : '-')}</span>
            <span className="font-mono">{row.best_score ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Leaderboard
