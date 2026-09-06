'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Pencil, AlertCircle, Eye, Search, Filter } from 'lucide-react'
import { Note } from '../../../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CONTENT_LIMIT = 1000

const emptyForm = {
  title: '',
  content: '',
  importance: 'low' as 'critical' | 'low',
  reminder_date: '',
}

export default function NotesPage() {
  const [noteList, setNoteList] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<{ submit?: string }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'low'>('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  async function fetchNotes() {
    const res = await fetch(`${BASE_URL}/notes`, { cache: 'no-store' })
    const data: Note[] = await res.json()
    setNoteList(data)
  }

  useEffect(() => { fetchNotes() }, [])

  function validate() {
    const e: typeof errors = {}

    if (!form.title.trim() && !form.content.trim()) {
      e.submit = "boş not kaydedilemez"
    }

    if (form.content.length > CONTENT_LIMIT) {
      e.submit = `İçerik ${CONTENT_LIMIT} karakteri aşamaz`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      reminder_date: form.reminder_date || null,
      importance: form.importance,
    }

    if (editingId) {
      await fetch(`${BASE_URL}/notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    fetchNotes()
  }

  function handleEdit(note: Note) {
    setForm({
      title: note.title ?? '',
      content: note.content ?? '',
      importance: note.importance,
      reminder_date: note.reminder_date ?? '',
    })
    setEditingId(note.id)
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
    await fetch(`${BASE_URL}/notes/${id}`, { method: 'DELETE' })
    setDeleteConfirmId(null)
    fetchNotes()
  }

  const inputClass = () =>
    `border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-violet-400 transition-colors w-full`

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredNotes = noteList
    .filter((n) => {
      if (filter === 'critical') return n.importance === 'critical'
      if (filter === 'low') return n.importance === 'low'
      return true
    })
    .filter((n) => {
      if (!debouncedQuery.trim()) return true
      const q = debouncedQuery.toLowerCase()
      return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    })

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">

      {/* Silme Onayı */}
      {deleteConfirmId !== null && (() => {
        const note = noteList.find((n) => n.id === deleteConfirmId)
        if (!note) return null
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 size={22} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-red-500 font-semibold tracking-wide uppercase">Silme Onayı</p>
                  <h2 className="text-base font-bold text-gray-900">{note.title || 'Başlıksız Not'}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500">Bu notu silmek istediğine emin misin?</p>
              <div className="flex flex-col gap-2">
                <button
                  aria-label={`Evet, sil. Başlığı "${note.title}" olan not`}
                  onClick={() => handleDelete(note.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Evet, Sil
                </button>
                <button
                  aria-label={`Vazgeç. Başlığı "${note.title}" olan not`}
                  onClick={() => setDeleteConfirmId(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Büyütme Modalı */}
      {expandedId !== null && (() => {
        const note = noteList.find((n) => n.id === expandedId)
        if (!note) return null
        const isNoteImportant = note.importance === 'critical'
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {isNoteImportant && <AlertCircle size={18} className="text-red-500 shrink-0" />}
                  <h2 className="text-xl font-bold text-gray-900">{note.title || 'Başlıksız Not'}</h2>
                </div>
                <button onClick={() => setExpandedId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded-lg hover:bg-gray-100 shrink-0">
                  <X size={18} />
                </button>
              </div>
              {note.content && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              )}
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                {note.reminder_date && (
                  <p className="text-xs text-amber-600 font-medium">
                    🔔 {new Date(note.reminder_date).toLocaleDateString('tr-TR')}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(note.created || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notlarım</h1>
          <p className="text-sm text-gray-500">{filteredNotes.length} adet not listeleniyor</p>
        </div>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors cursor-pointer"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'İptal' : 'Yeni Not'}
        </button>
      </div>
      {/* Form */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-2xl p-5 border border-gray-100 flex  flex-col gap-4 max-w-xl">
          <h2 className="font-bold text-gray-500 text-sm pb-2 ">
            {editingId ? 'Notu Düzenle' : 'Yeni Not Oluştur'}
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Başlık</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Not başlığı (isteğe bağlı)..."
                className={inputClass()}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">İçerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Not içeriği..."
                rows={4}
                maxLength={CONTENT_LIMIT}
                className={`${inputClass()} resize-none`}
              />
              <p className={`text-xs text-right ${form.content.length >= CONTENT_LIMIT ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {form.content.length} / {CONTENT_LIMIT}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_important"
                checked={form.importance === 'critical'}
                onChange={(e) => setForm({ ...form, importance: e.target.checked ? 'critical' : 'low' })}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="is_important" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5 select-none">
                <AlertCircle size={16} className="text-red-500" />
                Bu notu önemli olarak işaretle
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-50">
            <div className="flex-1">
              {errors.submit && (
                <p className="text-sm text-red-500 font-semibold flex items-center gap-1.5 ">
                  ⚠️ {errors.submit}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSave}
                className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 cursor-pointer transition-colors"
              >
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Filtreler */}
      <div className="flex flex-col">

        <div className="relative w-full mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-violet-400 transition-colors bg-white w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400 shrink-0">
            <Filter size={14} />
            <span className="text-xs font-medium">Filtrele:</span>
          </div>
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${filter === 'all' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Tümü
          </button>
          <button onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${filter === 'critical' ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-red-500 hover:bg-red-50'}`}>
            <AlertCircle size={12} /> Önemli
          </button>
          <button onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${filter === 'low' ? 'bg-gray-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            Normal
          </button>
        </div>
      </div>



      {/* Liste */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <p className="text-sm text-gray-400">
            {searchQuery
              ? 'Aramanızla eşleşen not bulunamadı.'
              : filter === 'critical'
                ? 'Önemli işaretli not bulunmuyor.'
                : filter === 'low'
                  ? 'Normal not bulunmuyor.'
                  : 'Henüz eklenmiş bir not bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredNotes.map((note) => {

            const isNoteImportant = note.importance === 'critical'
            const createdDate = new Date(note.created || Date.now())
            const createdLabel = createdDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            const createdFullLabel = createdDate.toLocaleString('tr-TR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div
                key={note.id}
                className={`bg-white rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 group relative border
                  ${isNoteImportant
                    ? 'border-red-500 shadow-[0_8px_30px_rgb(239,68,68,0.08)] bg-red-50/10'
                    : 'border-violet-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4 min-h-8">
                    {note.title ? (
                      <h2 className="text-[22px] font-bold text-[#0F1E36] tracking-tight leading-tight">
                        {note.title}
                      </h2>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
                      <button
                        aria-label='notun detayını gör'
                        title='Detayı gör'
                        onClick={() => setExpandedId(note.id)}
                        className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg cursor-pointer hover:bg-violet-50"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        aria-label='notu düzenle'
                        title='Düzenle'
                        onClick={() => handleEdit(note)}
                        className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors cursor-pointer rounded-lg hover:bg-violet-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        aria-label='notu sil (onay gerekir)'
                        title='Sil'
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {note.content && (
                    <p className="text-[14px] text-[#555E6D] font-normal leading-[1.6] mb-6 whitespace-pre-wrap line-clamp-4">
                      {note.content}
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="border-t border-gray-100/80 pt-4 flex flex-col gap-1">
                    {note.reminder_date && (
                      <p className="text-xs text-amber-600 font-medium mb-1">
                        🔔 {new Date(note.reminder_date).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                    <p className="text-[13px] text-[#7E8695] font-medium" title={`Kaydedildi: ${createdFullLabel}`}>
                      {createdLabel}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}