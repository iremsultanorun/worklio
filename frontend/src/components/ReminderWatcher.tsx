'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Clock, CheckCircle2, X } from 'lucide-react'
import { Reminder } from '../../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const getDefaultDate = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 30)
  return d.toISOString().split('T')[0]
}

const getDefaultTime = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 30)
  return d.toTimeString().slice(0, 5)
}

export default function ReminderWatcher() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null)
  const [snoozeDate, setSnoozeDate] = useState(getDefaultDate())
  const [snoozeTime, setSnoozeTime] = useState(getDefaultTime())
  const isUpdatingRef = useRef(false)
  const remindersRef = useRef<Reminder[]>([])

  const loadReminders = useCallback(async () => {
    if (isUpdatingRef.current) return
    try {
      const res = await fetch(`${BASE_URL}/reminders`)
      const data: Reminder[] = await res.json()
      setReminders(data)
      remindersRef.current = data
    } catch (err) {
      console.error('ReminderWatcher fetch error:', err)
    }
  }, [])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  useEffect(() => {
    const checkReminders = () => {
      if (isUpdatingRef.current) return
      if (activeAlert) return

      const now = new Date()
      const nowMs = now.getTime()

      const dueReminder = remindersRef.current.find((r) => {
        if (r.is_completed) return false

        if (r.snoozed_until) {
          const snoozeMs = new Date(r.snoozed_until).getTime()
          if (nowMs < snoozeMs) return false
          return true
        }

        const dateStr = r.date.includes('T') ? r.date.split('T')[0] : r.date
        const cleanTime = r.time ? r.time.slice(0, 5) : '00:00'
        const reminderMs = new Date(`${dateStr}T${cleanTime}`).getTime()

        if (isNaN(reminderMs)) return false
        return nowMs >= reminderMs
      })

      if (dueReminder) {
        setActiveAlert(dueReminder)
        setSnoozeDate(getDefaultDate())
        setSnoozeTime(getDefaultTime())
      }
    }

    checkReminders()
    const interval = setInterval(() => {
      loadReminders().then(checkReminders)
    }, 10000)

    return () => clearInterval(interval)
  }, [activeAlert, loadReminders])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeAlert) setActiveAlert(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeAlert])

  async function handleAlertComplete() {
    if (!activeAlert) return
    isUpdatingRef.current = true

    const updated = { ...activeAlert, is_completed: 1, snoozed_until: null }
    setReminders(prev => prev.map(r => r.id === activeAlert.id ? updated : r))
    remindersRef.current = remindersRef.current.map(r => r.id === activeAlert.id ? updated : r)
    setActiveAlert(null)

    try {
      await fetch(`${BASE_URL}/reminders/${activeAlert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activeAlert, is_completed: 1, snoozed_until: null }),
      })
      await loadReminders()
    } catch (err) {
      console.error('Complete error:', err)
      await loadReminders()
    } finally {
      isUpdatingRef.current = false
    }
  }

  async function handleAlertSnooze() {
    if (!activeAlert) return
    isUpdatingRef.current = true

    const snoozedUntil = `${snoozeDate}T${snoozeTime}`

    const updated = { ...activeAlert, snoozed_until: snoozedUntil }
    setReminders(prev => prev.map(r => r.id === activeAlert.id ? updated : r))
    remindersRef.current = remindersRef.current.map(r => r.id === activeAlert.id ? updated : r)
    setActiveAlert(null)

    try {
      await fetch(`${BASE_URL}/reminders/${activeAlert.id}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozed_until: snoozedUntil }),
      })
      await loadReminders()
    } catch (err) {
      console.error('Snooze error:', err)
      await loadReminders()
    } finally {
      isUpdatingRef.current = false
    }
  }

  if (!activeAlert) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 z-9999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl p-6 max-w-md w-full flex flex-col gap-5 shadow-2xl border border-violet-100">

        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl">
            <Bell size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-violet-600 font-bold tracking-wide uppercase">Hatırlatıcı</p>
            <h2 className="text-lg font-extrabold text-gray-950 truncate">{activeAlert.title}</h2>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {activeAlert.description && (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {activeAlert.description}
          </p>
        )}

        {/* Erteleme */}
        <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
            <Clock size={14} /> Ne Zaman Hatırlatılsın?
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white cursor-pointer outline-none focus:border-violet-400"
            />
            <input
              type="time"
              value={snoozeTime}
              onChange={(e) => setSnoozeTime(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white cursor-pointer outline-none focus:border-violet-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleAlertComplete}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-md shadow-green-100"
          >
            <CheckCircle2 size={16} /> Evet, Hallettim
          </button>
          <button
            onClick={handleAlertSnooze}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-md shadow-violet-100"
          >
            Seçilen Zamana Ertele
          </button>
        </div>
      </div>
    </div>
  )
}