'use client'

import { useState } from 'react'
import { Trash2, CheckCircle2, TrendingUp, Target, RotateCcw, X } from 'lucide-react'
import { Goal } from '../../../../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const categories = [
  { key: 'all', label: 'Tümü' },
  { key: 'ciro', label: 'Ciro' },
  { key: 'musteri', label: 'Müşteri' },
  { key: 'gider', label: 'Gider Azaltma' },
  { key: 'diger', label: 'Diğer' },
]

const sortOptions = [
  { key: 'date', label: 'Tarihe Göre' },
  { key: 'progress', label: 'İlerlemeye Göre' },
  { key: 'name', label: 'İsme Göre' },
]

function getRemainingDays(endDate: string | null) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

type Props = {
  goals: Goal[]
  type: 'active' | 'completed' | 'expired'
  onRefresh: () => void
}

export default function GoalsList({ goals, type, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('date')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [updateValue, setUpdateValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const filtered = goals
    .filter(g => search ? g.goal_name.toLowerCase().includes(search.toLowerCase()) : true)
    .filter(g => category !== 'all' ? g.category === category : true)
    .sort((a, b) => {
      if (sort === 'date') return new Date(a.end_date ?? '').getTime() - new Date(b.end_date ?? '').getTime()
      if (sort === 'progress') return (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount)
      if (sort === 'name') return a.goal_name.localeCompare(b.goal_name)
      return 0
    })

  async function handleComplete(goal: Goal) {
    const updated = { ...goal, is_completed: 1, current_amount: goal.target_amount }
    await fetch(`${BASE_URL}/goals/${goal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    onRefresh()
  }

  async function handleReactivate(goal: Goal) {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 7)
    const updated = { ...goal, end_date: newDate.toISOString().split('T')[0], is_completed: 0 }
    await fetch(`${BASE_URL}/goals/${goal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    onRefresh()
  }

  async function handleDelete(id: number) {
    setDeleteConfirmId(null)
    await fetch(`${BASE_URL}/goals/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  async function handleUpdateProgress(id: number) {
    const val = Number(updateValue)
    if (isNaN(val)) return
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    setUpdatingId(null)
    setUpdateValue('')
    await fetch(`${BASE_URL}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...goal, current_amount: val }),
    })
    onRefresh()
  }

  const emptyMessages = {
    active: 'Hiç aktif hedef bulunamadı.',
    completed: 'Henüz tamamlanan hedef yok.',
    expired: 'Süresi geçmiş hedef yok.',
  }

  return (
    <div className="flex flex-col gap-4">

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl"><Trash2 size={22} className="text-red-500" /></div>
              <div>
                <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Silme Onayı</p>
                <p className="text-sm font-bold text-gray-900">Bu hedefi silmek istediğine emin misin?</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors">Evet, Sil</button>
              <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors">Vazgeç</button>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Hedef ara..." className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 transition-colors bg-white" />

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${category === c.key ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {sortOptions.map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${sort === s.key ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <Target size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{emptyMessages[type]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {
            filtered.map(goal => {
              const pct = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0
              const remaining = getRemainingDays(goal.end_date)
              const isUpdating = updatingId === goal.id

              return (
                <div key={goal.id} className={`bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4 ${type === 'expired' ? 'border border-red-100' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{goal.goal_name}</p>
                        {goal.category && (
                          <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                            {categories.find(c => c.key === goal.category)?.label ?? goal.category}
                          </span>
                        )}
                        {type === 'completed' && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Tamamlandı</span>}
                        {type === 'expired' && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">Süresi Doldu</span>}
                      </div>
                      {goal.description && <p className="text-xs text-gray-500">{goal.description}</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {type === 'active' && (
                        <button onClick={() => handleComplete(goal)} className="p-1.5 text-green-300 hover:text-green-500 rounded-lg bg-green-50 cursor-pointer transition-colors">
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      {(type === 'completed' || type === 'expired') && (
                        <button onClick={() => handleReactivate(goal)} className="p-1.5 text-violet-400 hover:text-violet-600 rounded-lg bg-violet-50 cursor-pointer transition-colors" title="Yeniden Aktifleştir">
                          <RotateCcw size={15} />
                        </button>
                      )}
                      {type === 'completed' && (
                        <button onClick={() => handleComplete(goal)} className="p-1.5 text-amber-400 bg-amber-50 rounded-lg cursor-pointer transition-colors" title="Tamamlanmadı yap">
                          <X size={15} />
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirmId(goal.id)} className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* İlerleme */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">İlerleme</span>
                      <span className={`text-sm font-bold ${type === 'expired' ? 'text-red-500' : type === 'completed' ? 'text-green-600' : 'text-violet-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${type === 'expired' ? 'bg-red-400' : type === 'completed' ? 'bg-green-500' : 'bg-violet-600'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Mevcut: <span className="font-semibold text-gray-700">{goal.current_amount.toLocaleString('tr-TR')} ₺</span></span>
                      <span>Hedef: <span className="font-semibold text-gray-700">{goal.target_amount.toLocaleString('tr-TR')} ₺</span></span>
                    </div>
                  </div>

                  {/* Alt bilgi */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {goal.end_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>{type === 'completed' ? 'Tamamlandı:' : 'Son Tarih:'} {new Date(goal.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {type === 'active' && remaining !== null && remaining <= 7 && remaining >= 0 && (
                          <span className="text-red-500 font-medium">{remaining === 0 ? 'Son gün!' : `${remaining} gün kaldı`}</span>
                        )}
                      </div>
                    )}

                    {type === 'active' && (
                      isUpdating ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={updateValue} onChange={e => setUpdateValue(e.target.value)}
                            placeholder="Yeni değer" autoFocus
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-28 outline-none focus:border-violet-400" />
                          <button onClick={() => handleUpdateProgress(goal.id)} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-violet-700 transition-colors">Kaydet</button>
                          <button onClick={() => { setUpdatingId(null); setUpdateValue('') }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">İptal</button>
                        </div>
                      ) : (
                        <button onClick={() => { setUpdatingId(goal.id); setUpdateValue(String(goal.current_amount)) }}
                          className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 cursor-pointer transition-colors">
                          <TrendingUp size={12} /> İlerlemeyi Güncelle
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}