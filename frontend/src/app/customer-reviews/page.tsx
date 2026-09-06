'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, X, Pencil, ThumbsUp, ThumbsDown, Lightbulb, MessageSquare } from 'lucide-react'
import { CustomerReview } from '../../../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const emptyForm = {
  note: '',
  tag: 'positive',
  date: new Date().toISOString().split('T')[0],
}

const tags = [
  { key: 'positive', label: 'Olumlu', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-600' },
  { key: 'negative', label: 'Olumsuz', icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', activeBg: 'bg-red-500' },
  { key: 'suggestion', label: 'Öneri', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-500' },
] as const

type TagKey = 'positive' | 'negative' | 'suggestion'

export default function CustomerReviewsPage() {
  const [reviewList, setReviewList] = useState<CustomerReview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<{ note?: string }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<TagKey | 'all'>('all')
  const [detailReview, setDetailReview] = useState<CustomerReview | null>(null)

  async function fetchReviews() {
    const res = await fetch(`${BASE_URL}/customer-reviews`, { cache: 'no-store' })
    const data: CustomerReview[] = await res.json()
    setReviewList(data)
  }

  useEffect(() => { fetchReviews() }, [])

  const stats = useMemo(() => ({
    positive: reviewList.filter((r) => r.tag === 'positive').length,
    negative: reviewList.filter((r) => r.tag === 'negative').length,
    suggestion: reviewList.filter((r) => r.tag === 'suggestion').length,
  }), [reviewList])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return reviewList
    return reviewList.filter((r) => r.tag === activeFilter)
  }, [reviewList, activeFilter])

  function validate() {
    const e: typeof errors = {}
    if (!form.note.trim()) e.note = 'Yorum zorunludur'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    if (editingId) {
      await fetch(`${BASE_URL}/customer-reviews/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
    } else {
      await fetch(`${BASE_URL}/customer-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
    }
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    fetchReviews()
  }

  function handleEdit(review: CustomerReview) {
    setForm({
      note: review.note,
      tag: review.tag,
      date: review.date ?? new Date().toISOString().split('T')[0],
    })
    setEditingId(review.id)
    setShowForm(true)
    setErrors({})
    setDetailReview(null)
  }

  function handleCancel() {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setShowForm(false)
    setErrors({})
  }

  async function handleDelete(id: number) {
    await fetch(`${BASE_URL}/customer-reviews/${id}`, { method: 'DELETE' })
    setDeleteConfirmId(null)
    setDetailReview(null)
    fetchReviews()
  }

  const inputClass = (error?: string) =>
    `border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-violet-400 transition-colors w-full`

  return (
    <div className="p-4 flex flex-col gap-6">

      {/* Silme Onayı Modalı */}
      {deleteConfirmId !== null && (() => {
        const review = reviewList.find((r) => r.id === deleteConfirmId)
        if (!review) return null
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 size={22} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-red-500 font-semibold tracking-wide uppercase">Silme Onayı</p>
                  <h2 className="text-base font-bold text-gray-900 line-clamp-1">{review.note}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500">Bu yorumu silmek istediğine emin misin?</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleDelete(review.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  Evet, Sil
                </button>
                <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Detay Modalı */}
      {detailReview && (() => {
        const t = tags.find((x) => x.key === detailReview.tag)!
        const Icon = t.icon
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailReview(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${t.bg}`}>
                  <Icon size={13} className={t.color} />
                  <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>
                </div>
                <button onClick={() => setDetailReview(null)} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detailReview.note}</p>
              <p className="text-xs text-gray-400">
                {detailReview.date
                  ? new Date(detailReview.date).toLocaleDateString('tr-TR')
                  : new Date(detailReview.created).toLocaleDateString('tr-TR')}
              </p>
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => handleEdit(detailReview)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  <Pencil size={14} /> Düzenle
                </button>
                <button onClick={() => setDeleteConfirmId(detailReview.id)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  <Trash2 size={14} /> Sil
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Müşteri Görüşleri</h1>
          <p className="text-sm text-gray-500">{reviewList.length} görüş</p>
        </div>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors cursor-pointer"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'İptal' : 'Yeni Görüş'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">
            {editingId ? 'Görüşü Düzenle' : 'Yeni Müşteri Görüşü'}
          </h2>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Etiket</label>
              <div className="grid grid-cols-3 gap-2">
                {tags.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.key}
                      onClick={() => setForm({ ...form, tag: t.key })}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${form.tag === t.key
                          ? `${t.bg} ${t.border} ${t.color}`
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">
                  Yorum <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-300">{form.note.length}/500</span>
              </div>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value.slice(0, 500) })}
                placeholder="Müşteri ne dedi?"
                rows={3}
                maxLength={500}
                className={`${inputClass(errors.note)} resize-none`}
              />
              {errors.note && <p className="text-xs text-red-500">{errors.note}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tarih</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass()}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="self-end bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors cursor-pointer"
          >
            {editingId ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${activeFilter === 'all'
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Tümü
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {reviewList.length}
          </span>
        </button>
        {tags.map((t) => {
          const Icon = t.icon
          const isActive = activeFilter === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveFilter(t.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${isActive
                  ? `${t.activeBg} border-transparent text-white`
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : t.color} />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {stats[t.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white shadow-sm rounded-2xl p-8 text-center">
          <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Bu kategoride henüz görüş yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((review) => {
            const t = tags.find((x) => x.key === review.tag)!
            const Icon = t.icon
            return (
              <div
                key={review.id}
                onClick={() => setDetailReview(review)}
                className={`bg-white border ${t.border} rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${t.bg} shrink-0`}>
                    <Icon size={12} className={t.color} />
                    <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(review)} className="p-1.5 text-gray-300 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 cursor-pointer">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(review.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{review.note}</p>
                <p className="text-xs text-gray-300">
                  {review.date
                    ? new Date(review.date).toLocaleDateString('tr-TR')
                    : new Date(review.created).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}