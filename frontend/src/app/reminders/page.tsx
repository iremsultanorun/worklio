'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Bell, Plus, Trash2, X, Pencil, AlertTriangle, Clock, Search, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Reminder } from '../../../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const TITLE_LIMIT = 100
const DESCRIPTION_LIMIT = 500

const getDefaultDate = () => new Date().toISOString().split('T')[0]
const getDefaultTime = () => {
  const now = new Date()
  now.setHours(now.getHours() + 1)
  return now.toTimeString().slice(0, 5)
}

const emptyForm = {
  title: '',
  description: '',
  date: getDefaultDate(),
  time: getDefaultTime(),
  repeat: 'once',
  repeat_day: '',
  person_name: '',
  phone: '',
}

type Filter = 'all' | 'active' | 'expired' | 'snoozed'

export default function RemindersPage() {
  const [reminderList, setReminderList] = useState<Reminder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<{ title?: string; date?: string; phone?: string; time?: string; description?: string }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [showPersonFields, setShowPersonFields] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/reminders`, { cache: 'no-store' })
      const data: Reminder[] = await res.json()
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime()
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime()
        return dateB - dateA
      })
      setReminderList(sorted)
    } catch (error) {
      console.error("Hatırlatıcılar yüklenirken hata oluştu:", error)
    }
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (deleteConfirmId !== null) setDeleteConfirmId(null)
        else if (showForm) handleCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [deleteConfirmId, showForm])

  const processedReminders = useMemo(() => {
    const now = new Date()
    return reminderList
      .map((r) => {
        const isSnoozed = r.snoozed_until && new Date(r.snoozed_until).getTime() > now.getTime()
        return {
          ...r,
          expired: !isSnoozed && new Date(`${r.date}T${r.time || '23:59'}`) < now,
          isSnoozed: !!isSnoozed,
        }
      })
      .sort((a, b) => {
        if (a.expired && !b.expired) return 1
        if (!a.expired && b.expired) return -1
        return 0
      })
  }, [reminderList])

  const filteredReminders = useMemo(() => {
    return processedReminders.filter(r => {
      const matchesSearch = debouncedSearch
        ? r.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (r.person_name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
        : true

      const matchesFilter =
        filter === 'all' ? true :
          filter === 'active' ? !r.expired && !r.isSnoozed && !r.is_completed :
            filter === 'expired' ? r.expired :
              filter === 'snoozed' ? r.isSnoozed : true

      return matchesSearch && matchesFilter
    })
  }, [processedReminders, debouncedSearch, filter])

  function validate() {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Başlık zorunludur'
    if (form.title.length > TITLE_LIMIT) e.title = `Başlık en fazla ${TITLE_LIMIT} karakter olabilir`
    if (!form.date) e.date = 'Tarih zorunludur'
    if (!form.time) e.time = 'Saat zorunludur'
    if (form.description.length > DESCRIPTION_LIMIT) e.description = `Açıklama en fazla ${DESCRIPTION_LIMIT} karakter olabilir`
    if (form.phone && !/^\d{10,11}$/.test(form.phone.replace(/\s/g, ''))) {
      e.phone = 'Geçerli bir numara girin (10-11 haneli)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePhoneChange(val: string) {
    const onlyNumbers = val.replace(/\D/g, '').slice(0, 11)
    setForm({ ...form, phone: onlyNumbers })
  }

  async function handleSave() {
    if (!validate()) return

    const tempId = Date.now()
    const newReminder = { ...form, id: tempId, is_completed: 0, snoozed_until: null, created: new Date().toISOString() }

    try {
      if (editingId) {
        setReminderList(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r))
        await fetch(`${BASE_URL}/reminders/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form }),
        })
      } else {
        setReminderList(prev => [newReminder as Reminder, ...prev])
        await fetch(`${BASE_URL}/reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, is_completed: 0 }),
        })
      }
    } catch (err) {
      console.error("Kaydedilirken hata oluştu:", err)
    }

    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    setShowPersonFields(false)
    fetchReminders()
  }

  function handleEdit(reminder: Reminder) {
    setForm({
      title: reminder.title,
      description: reminder.description ?? '',
      date: reminder.date,
      time: reminder.time ?? '',
      repeat: reminder.repeat,
      repeat_day: reminder.repeat_day ?? '',
      person_name: reminder.person_name ?? '',
      phone: reminder.phone ?? '',
    })
    setEditingId(reminder.id)
    setShowForm(true)
    setShowPersonFields(!!(reminder.person_name || reminder.phone))
    setErrors({})
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function handleCancel() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    setShowPersonFields(false)
  }

  async function handleDelete(id: number) {
    setReminderList(prev => prev.filter(r => r.id !== id))
    setDeleteConfirmId(null)
    try {
      await fetch(`${BASE_URL}/reminders/${id}`, { method: 'DELETE' })
    } catch {
      fetchReminders()
    }
  }

  async function handleToggleComplete(reminder: Reminder) {
    const updated = { ...reminder, is_completed: reminder.is_completed ? 0 : 1 }
    setReminderList(prev => prev.map(r => r.id === reminder.id ? updated : r))
    try {
      await fetch(`${BASE_URL}/reminders/${reminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      fetchReminders()
    }
  }

  const repeatLabel: Record<string, string> = {
    once: 'Bir kez',
    daily: 'Her gün',
    weekly: 'Her hafta',
    monthly: 'Her ay',
  }

  const filterLabels: Record<Filter, string> = {
    all: `Tümü (${processedReminders.length})`,
    active: `Aktif (${processedReminders.filter(r => !r.expired && !r.isSnoozed && !r.is_completed).length})`,
    expired: `Geçmiş (${processedReminders.filter(r => r.expired).length})`,
    snoozed: `Ertelenen (${processedReminders.filter(r => r.isSnoozed).length})`,
  }

  const inputClass = (error?: string) =>
    `border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors w-full cursor-text`

  return (
    <div className="p-4 max-w-7xl mx-auto flex flex-col gap-6">

      {deleteConfirmId !== null && (() => {
        const reminder = reminderList.find((r) => r.id === deleteConfirmId)
        if (!reminder) return null
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 size={22} className="text-red-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-red-500 font-semibold tracking-wide uppercase">Silme Onayı</p>
                  <h2 className="text-base font-bold text-gray-900 line-clamp-1 ">{reminder.title}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500">Bu hatırlatıcıyı silmek istediğine emin misin? Bu işlem geri alınamaz.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                  autoFocus
                >
                  Evet, Sil
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hatırlatıcılar</h1>
          <p className="text-sm text-gray-500">{reminderList.length} hatırlatıcı</p>
        </div>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {showForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {showForm ? 'İptal' : 'Yeni Ekle'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Başlık, açıklama veya kişi ara..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors bg-white cursor-text"
          />
        </div>
        <div className="flex gap-2 flex-wrap" role="group">
          {(Object.keys(filterLabels) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300 ${filter === f ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div
          ref={formRef}
          className="bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="w-1.5 h-5 bg-violet-500 rounded-full" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {editingId ? 'Mevcut Hatırlatıcıyı Düzenle' : 'Yeni Hatırlatıcı Detayları'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-gray-50/50 border border-gray-100/80 rounded-2xl p-4 flex flex-col gap-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400">1. Bilgi & İçerik</div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="title" className="text-xs font-bold text-[#555E6D]">Başlık *</label>
                  <span className={`text-xs ${form.title.length >= TITLE_LIMIT ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {form.title.length} / {TITLE_LIMIT}
                  </span>
                </div>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value })
                    if (errors.title) setErrors({ ...errors, title: undefined })
                  }}
                  placeholder="Örn: Ekmekçiyi ara..."
                  maxLength={TITLE_LIMIT}
                  className={inputClass(errors.title)}
                />
                {errors.title && <p className="text-xs text-red-500 font-semibold" role="alert">{errors.title}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-xs font-bold text-[#555E6D]">Açıklama</label>
                  <span className={`text-xs ${form.description.length >= DESCRIPTION_LIMIT ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {form.description.length} / {DESCRIPTION_LIMIT}
                  </span>
                </div>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Hatırlatıcı detayları..."
                  rows={2}
                  maxLength={DESCRIPTION_LIMIT}
                  className={`${inputClass(errors.description)} resize-none`}
                />
                {errors.description && <p className="text-xs text-red-500 font-semibold" role="alert">{errors.description}</p>}
              </div>
            </div>

            <div className="bg-gray-50/50 border border-gray-100/80 rounded-2xl p-4 flex flex-col gap-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400">2. Zaman Ayarları</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="date" className="text-xs font-bold text-[#555E6D]">Tarih *</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => {
                      setForm({ ...form, date: e.target.value })
                      if (errors.date) setErrors({ ...errors, date: undefined })
                    }}
                    className={inputClass(errors.date)}
                  />
                  {errors.date && <p className="text-xs text-red-500 font-semibold" role="alert">{errors.date}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="time" className="text-xs font-bold text-[#555E6D]">Saat *</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => {
                      setForm({ ...form, time: e.target.value })
                      if (errors.time) setErrors({ ...errors, time: undefined })
                    }}
                    className={inputClass(errors.time)}
                  />
                  {errors.time && <p className="text-xs text-red-500 font-semibold" role="alert">{errors.time}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="repeat" className="text-xs font-bold text-[#555E6D]">Tekrar Periyodu</label>
                <select
                  id="repeat"
                  value={form.repeat}
                  onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                  className={`${inputClass()} bg-white cursor-pointer`}
                >
                  <option value="once">Bir kez</option>
                  <option value="daily">Her gün</option>
                  <option value="weekly">Her hafta</option>
                  <option value="monthly">Her ay</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPersonFields(!showPersonFields)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">3. İlgili Kişi (Opsiyonel)</span>
              {showPersonFields ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>

            {showPersonFields && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="person_name" className="text-xs font-bold text-[#555E6D]">Kişi Adı</label>
                  <input
                    id="person_name"
                    type="text"
                    value={form.person_name}
                    onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                    placeholder="Ahmet Ekmekçi"
                    className={inputClass()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-[#555E6D]">Telefon Numarası</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="05550000000"
                    maxLength={11}
                    className={inputClass(errors.phone)}
                  />
                  {errors.phone
                    ? <p className="text-xs text-red-500 font-semibold" role="alert">{errors.phone}</p>
                    : <p className="text-[10px] text-gray-400 font-medium">Sadece rakam (Örn: 05xxxxxxxxx)</p>
                  }
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-50">
            <button
              onClick={handleCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-violet-100 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {editingId ? 'Değişiklikleri Güncelle' : 'Hatırlatıcıyı Kaydet'}
            </button>
          </div>
        </div>
      )}

      {filteredReminders.length === 0 ? (
        <div className="bg-white shadow-sm rounded-2xl p-10 text-center">
          <Bell size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">
            {debouncedSearch || filter !== 'all' ? 'Arama kriterlerine uygun hatırlatıcı bulunamadı.' : 'Henüz hatırlatıcı yok.'}
          </p>
          {(debouncedSearch || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="mt-3 text-xs text-violet-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300 rounded"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredReminders.map((reminder) => (
            <article
              key={reminder.id}
              className={`bg-white shadow-sm rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-default border border-transparent hover:border-violet-100 hover:shadow-md ${reminder.expired ? 'opacity-60' : ''} ${reminder.is_completed ? 'opacity-50' : ''}`}
            >
              {reminder.expired && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={13} />
                  <span>Bu hatırlatıcının tarihi geçti</span>
                </div>
              )}
              {reminder.isSnoozed && reminder.snoozed_until && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Clock size={13} />
                  <span>
                    Ertelendi → {new Date(reminder.snoozed_until).toLocaleDateString('tr-TR')} {new Date(reminder.snoozed_until).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate text-gray-900 ${reminder.is_completed ? 'line-through text-gray-400' : ''}`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-xs text-gray-400">
                      {reminder.date}{reminder.time ? ` ${reminder.time}` : ''}
                    </span>
                    <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                      {repeatLabel[reminder.repeat]}
                    </span>
                    {reminder.phone && (
                      <a
                        href={`https://wa.me/90${reminder.phone.replace(/\D/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full hover:bg-green-200 transition-colors cursor-pointer"
                      >
                        WhatsApp{reminder.person_name ? `: ${reminder.person_name}` : ''}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleComplete(reminder)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300 ${reminder.is_completed ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                    title={reminder.is_completed ? 'Tamamlanmadı yap' : 'Tamamlandı yap'}
                  >
                    <CheckCircle2 size={15} />
                  </button>
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-2 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                    title="Düzenle"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300"
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}