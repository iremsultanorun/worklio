'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { Plus, X, Pencil, Trash2, Target, CheckCircle2, AlertTriangle, Clock, TrendingUp, Trophy, Zap, MoveRight, RotateCcw } from 'lucide-react'
import { Goal } from '../../../lib/types'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const getDefaultDate = () => {
  const afterAWeek = new Date()
  afterAWeek.setDate(afterAWeek.getDate() + 7)
  return afterAWeek.toISOString().split('T')[0]
}

const emptyForm = {
  goal_name: '',
  description: '',
  target_amount: '',
  current_amount: '0',
  end_date: getDefaultDate(),
  category: 'ciro',
}

const categories = [
  { key: 'ciro', label: 'Ciro' },
  { key: 'musteri', label: 'Müşteri' },
  { key: 'gider', label: 'Gider Azaltma' },
  { key: 'diger', label: 'Diğer' },
]

function getStatus(goal: Goal) {
  const now = new Date()
  if (goal.is_completed) return 'completed'
  if (goal.end_date && new Date(goal.end_date) < now) return 'expired'
  return 'active'
}

function getRemainingDays(endDate: string | null) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

const CircleProgress = memo(function CircleProgress({ percentage }: { percentage: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="#7c3aed" strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-base font-bold text-gray-900">{percentage}%</span>
    </div>
  )
})

export default function GoalsPage() {
  const [goalList, setGoalList] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<{ goal_name?: string; target_amount?: string; end_date?: string }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [updateValue, setUpdateValue] = useState('')

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/goals`)
    const data: Goal[] = await res.json()
    setGoalList(data)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const active = useMemo(() => goalList.filter((g) => getStatus(g) === 'active'), [goalList])
  const completed = useMemo(() => goalList.filter((g) => g.is_completed), [goalList])
  const expired = useMemo(() => goalList.filter((g) => getStatus(g) === 'expired'), [goalList])

  function validate() {
    const e: typeof errors = {}
    if (!form.goal_name.trim()) e.goal_name = 'Hedef adı zorunludur'
    if (!form.target_amount || isNaN(Number(form.target_amount))) e.target_amount = 'Geçerli bir rakam girin'
    if (!form.end_date) e.end_date = 'Bitiş tarihi zorunludur'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    const body = {
      ...form,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount),
      is_completed: 0,
    }
    if (editingId) {
      setGoalList(prev => prev.map(g => g.id === editingId ? { ...g, ...body } : g))
      await fetch(`${BASE_URL}/goals/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetch(`${BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      fetchGoals()
    }
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
  }

  function handleEdit(goal: Goal) {
    setForm({
      goal_name: goal.goal_name,
      description: goal.description ?? '',
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      end_date: goal.end_date ?? '',
      category: goal.category ?? 'ciro',
    })
    setEditingId(goal.id)
    setShowForm(true)
    setErrors({})
  }

  function handleCancel() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
  }

  async function handleDelete(id: number) {
    setGoalList(prev => prev.filter(g => g.id !== id))
    setDeleteConfirmId(null)
    try {
      await fetch(`${BASE_URL}/goals/${id}`, { method: 'DELETE' })
    } catch {
      fetchGoals()
    }
  }

  async function handleComplete(goal: Goal) {
    const isCompleting = !goal.is_completed
    const updated = {
      ...goal,
      is_completed: isCompleting ? 1 : 0,
      current_amount: isCompleting ? goal.target_amount : goal.current_amount,
    }
    setGoalList(prev => prev.map(g => g.id === goal.id ? updated : g))
    try {
      await fetch(`${BASE_URL}/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      fetchGoals()
    }
  }
  async function handleReactivateExpired(goal: Goal) {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 7)
    const updated = { ...goal, end_date: newDate.toISOString().split('T')[0] }
    setGoalList(prev => prev.map(g => g.id === goal.id ? updated : g))
    await fetch(`${BASE_URL}/goals/${goal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }

  async function handleUpdateProgress(id: number) {
    const val = Number(updateValue)
    if (isNaN(val)) return
    const goal = goalList.find((g) => g.id === id)
    if (!goal) return
    setGoalList(prev => prev.map(g => g.id === id ? { ...g, current_amount: val } : g))
    setUpdatingId(null)
    setUpdateValue('')
    try {
      await fetch(`${BASE_URL}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, current_amount: val }),
      })
    } catch {
      fetchGoals()
    }
  }

  const inputClass = (error?: string) =>
    `border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-violet-400 transition-colors w-full`

  return (
    <div className="p-4 flex flex-col gap-6">

      {deleteConfirmId !== null && (() => {
        const goal = goalList.find((g) => g.id === deleteConfirmId)
        if (!goal) return null
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-xl"><Trash2 size={22} className="text-red-500" /></div>
                <div>
                  <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Silme Onayı</p>
                  <p className="text-base font-bold text-gray-900">{goal.goal_name}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Bu hedefi silmek istediğine emin misin?</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleDelete(goal.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer">Evet, Sil</button>
                <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer">Vazgeç</button>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hedeflerim</h1>
          <p className="text-sm text-gray-500">İlerlemeyi takip et ve vizyonuna ulaş.</p>
        </div>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors cursor-pointer"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'İptal' : 'Yeni Hedef'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-5 w-full mx-auto">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="font-semibold text-lg text-gray-900">{editingId ? 'Hedefi Düzenle' : 'Yeni Hedef Oluştur'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">İşletmenizin gelecekteki adımlarını planlayın.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-semibold text-gray-600">Hedef Adı <span className="text-red-500">*</span></label>
                <input type="text" value={form.goal_name} onChange={(e) => setForm({ ...form, goal_name: e.target.value })} placeholder="Bu ay 80.000 TL ciro..." className={inputClass(errors.goal_name)} />
                {errors.goal_name && <p className="text-xs text-red-500">{errors.goal_name}</p>}
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Açıklama</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detaylar..." className={inputClass()} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <label className="text-xs font-semibold text-gray-600">Kategori</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((c) => (
                  <button key={c.key} type="button" onClick={() => setForm({ ...form, category: c.key })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer duration-200 ${form.category === c.key ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Hedef Rakam <span className="text-red-500">*</span></label>
                <input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="80000" className={inputClass(errors.target_amount)} />
                {errors.target_amount && <p className="text-xs text-red-500">{errors.target_amount}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Mevcut Rakam</label>
                <input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="0" className={inputClass()} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Bitiş Tarihi <span className="text-red-500">*</span></label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass(errors.end_date)} />
                {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-2">
            <button onClick={handleCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">İptal</button>
            <button onClick={handleSave} className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 active:scale-[0.98] transition-all shadow-sm shadow-violet-100 cursor-pointer">
              {editingId ? 'Değişiklikleri Kaydet' : 'Hedef Oluştur'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-violet-600 rounded-2xl p-5 flex items-center gap-4 mb-5">
        <div className="p-3 bg-white/20 rounded-xl shrink-0">
          <Trophy size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Harika gidiyorsun!</p>
          <p className="text-violet-200 text-xs mt-0.5">
            {completed.length > 0 ? `${completed.length} hedefini tamamladın. Devam et!` : 'İlk hedefini ekle ve ilerlemeye başla.'}
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{active.length}</p>
            <p className="text-violet-200 text-xs">AKTİF</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{completed.length}</p>
            <p className="text-violet-200 text-xs">BİTEN</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <Zap size={16} className="text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Aktif Hedefler</h2>
            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">{active.length}</span>
          </div>
          <Link href="/goals/active-goals" className="flex gap-1 items-center text-violet-600 text-xs hover:underline transition-colors">
            Tümünü Gör <MoveRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {active.length === 0 ? (
            <div className="col-span-3 bg-white shadow-sm rounded-2xl p-8 text-center">
              <Target size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz aktif hedef yok.</p>
            </div>
          ) : (
            active.slice(0, 3).map((goal) => {
              const pct = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0
              const remaining = getRemainingDays(goal.end_date)
              const isUpdating = updatingId === goal.id
              const isCircle = pct >= 60
              return (
                <div key={goal.id} className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">Devam Ediyor</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleEdit(goal)} className="p-1.5 cursor-pointer text-violet-500 hover:bg-violet-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirmId(goal.id)} className="p-1.5 cursor-pointer text-red-400 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                      <button onClick={() => handleComplete(goal)} className="p-1.5 ml-2 text-green-300 hover:text-green-500 active:text-green-600 transition-colors rounded-lg bg-green-50 cursor-pointer"><CheckCircle2 size={24} /></button>
                    </div>
                  </div>

                  {isCircle ? (
                    <div className="flex flex-col items-center gap-2">
                      <CircleProgress percentage={pct} />
                      <p className="text-sm font-semibold text-gray-900 text-center">{goal.goal_name}</p>
                      {goal.description && <p className="text-xs text-gray-500 text-center">{goal.description}</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-gray-900">{goal.goal_name}</p>
                      {goal.description && <p className="text-xs text-gray-500">{goal.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">İlerleme</span>
                        <span className="text-sm font-bold text-violet-600">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Tutar bilgisi */}
                  <div className="flex justify-between text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                    <span>Mevcut: <span className="font-semibold text-gray-700">{goal.current_amount.toLocaleString('tr-TR')} ₺</span></span>
                    <span>Hedef: <span className="font-semibold text-gray-700">{goal.target_amount.toLocaleString('tr-TR')} ₺</span></span>
                  </div>

                  {goal.end_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>Son Tarih: {new Date(goal.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {remaining !== null && remaining <= 7 && remaining >= 0 && (
                        <span className="text-red-500 font-medium ml-auto">{remaining === 0 ? 'Son gün!' : `${remaining} gün`}</span>
                      )}
                    </div>
                  )}

                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)} placeholder="Yeni değer" className="border border-gray-200 rounded-lg px-2 py-1 text-xs flex-1 outline-none focus:border-violet-400" autoFocus />
                      <button onClick={() => handleUpdateProgress(goal.id)} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 transition-colors cursor-pointer">Kaydet</button>
                      <button onClick={() => { setUpdatingId(null); setUpdateValue('') }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => { setUpdatingId(goal.id); setUpdateValue(String(goal.current_amount)) }}
                      className="text-xs cursor-pointer text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 transition-colors w-fit">
                      <TrendingUp size={12} /> İlerlemeyi Güncelle
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
        <div className={`${expired.length > 0 ? 'col-span-7' : 'col-span-12'} flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <CheckCircle2 size={16} className="text-green-500" />
              <h2 className="text-sm font-semibold text-gray-900">Tamamlananlar</h2>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">{completed.length}</span>
            </div>
            <Link href="/goals/completed-goals" className="flex gap-1 items-center text-violet-600 text-xs hover:underline transition-colors">
              Tümünü Gör <MoveRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {completed.length === 0 ? (
              <div className="bg-white shadow-sm rounded-2xl p-6 text-center">
                <CheckCircle2 size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Henüz tamamlanan hedef yok.</p>
              </div>
            ) : (
              completed.slice(0, 3).map((goal) => (
                <div key={goal.id} className="bg-white shadow-sm rounded-2xl p-4 flex items-center gap-3 group">
                  <div className="p-2 bg-green-50 rounded-lg shrink-0">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{goal.goal_name}</p>
                    {goal.description && <p className="text-xs text-gray-500 truncate">{goal.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {goal.end_date && new Date(goal.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-semibold text-green-600">
                        {goal.target_amount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium shrink-0">Tamamlandı</span>
                  <span className="text-sm font-bold text-green-600 shrink-0">100%</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-amber-500 bg-amber-50 rounded-lg cursor-pointer"><RotateCcw size={13} /></button>
                    <button onClick={() => setDeleteConfirmId(goal.id)} className="p-1.5 text-red-400 rounded-lg bg-red-50 cursor-pointer"><Trash2 size={13} /></button>
                  </div>
                </div>

              )
              )
            )}
          </div>
        </div>

        {expired.length > 0 && (
          <div className="md:col-span-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-gray-900">Süresi Geçenler</h2>
                <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">{expired.length}</span>
              </div>
              <Link href="/goals/expired-goals" className="flex gap-1 items-center text-violet-600 text-xs hover:underline transition-colors">
                Tümü <MoveRight size={13} />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {expired.slice(0, 4).map((goal) => {
                const pct = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0
                return (
                  <div key={goal.id} className="bg-white border border-red-100 shadow-sm rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 bg-red-50 rounded-lg shrink-0">
                          <AlertTriangle size={12} className="text-red-500" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900 truncate">{goal.goal_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium shrink-0">Doldu</span>
                        <div className='flex items-center gap-0.5'>
                          <button
                            onClick={() => handleReactivateExpired(goal)}
                            className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 cursor-pointer"
                            title="Yeniden Aktifleştir"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(goal.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-red-500 font-medium shrink-0">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-red-50">
                      <span>
                        Bitti: <span className="text-red-500 font-medium">
                          {goal.end_date && new Date(goal.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </span>
                      <span>
                        Hedef: <span className="text-red-500 font-medium">{goal.target_amount.toLocaleString('tr-TR')} ₺</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}