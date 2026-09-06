'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Goal } from '../../../../lib/types'
import GoalsList from '../_components/GoalsList'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ActiveGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/goals`)
    const data: Goal[] = await res.json()
    setGoals(data.filter(g => !g.is_completed && (!g.end_date || new Date(g.end_date) >= new Date())))
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/goals" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aktif Hedefler</h1>
          <p className="text-sm text-gray-500">{goals.length} hedef</p>
        </div>
      </div>
      <GoalsList goals={goals} type="active" onRefresh={fetchGoals} />
    </div>
  )
}