'use client'

import { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2, Wallet, TrendingUp, DollarSign, Calendar, BarChart3, ChevronDown, ChevronUp, AlertCircle, Tag, Search } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const MAX_AMOUNT = 999_999_999

type Cash = {
  id: number
  date: string
  title: string
  amount: number
  density: 'calm' | 'moderate' | 'busy' | ''
  created: string
}

const densityLabel: Record<string, { label: string; color: string; fill: string }> = {
  calm: { label: 'Sakin', color: 'bg-blue-50 text-blue-600 border border-blue-100', fill: '#60a5fa' },
  moderate: { label: 'Orta', color: 'bg-amber-50 text-amber-600 border border-amber-100', fill: '#fbbf24' },
  busy: { label: 'Yoğun', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100', fill: '#34d399' },
}

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  density: '' as 'calm' | 'moderate' | 'busy' | '',
}

function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseAmountInput(value: string): number {
  return Number(value.replace(/\./g, ''))
}

export default function CashPage() {
  const [cashList, setCashList] = useState<Cash[]>([])
  const [form, setForm] = useState(emptyForm)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null)
  const [showCharts, setShowCharts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cashSearch, setCashSearch] = useState('')

  async function fetchCash() {
    const res = await fetch(`${BASE_URL}/cash`)
    const data: Cash[] = await res.json()
    setCashList(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  async function fetchRates() {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY')
      const data = await res.json()
      setRates({ usd: +(1 / data.rates.USD).toFixed(2), eur: +(1 / data.rates.EUR).toFixed(2) })
    } catch {
      setRates(null)
    }
  }

  useEffect(() => {
    fetchCash()
    fetchRates()
  }, [])

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })


  const { total, monthSum, avg, last14, densityData } = useMemo(() => {
    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7)
    const monthly = cashList.filter(c => c.date.startsWith(thisMonth))

    const total = cashList.reduce((s, c) => s + c.amount, 0)
    const monthSum = monthly.reduce((s, c) => s + c.amount, 0)
    const avg = monthly.length ? monthSum / monthly.length : 0

    const last14 = [...cashList].slice(0, 14).reverse().map(c => ({
      gun: new Date(c.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      tutar: c.amount,
    }))

    const densityCount = { calm: 0, moderate: 0, busy: 0 }
    cashList.forEach(c => {
      if (c.density && c.density in densityCount) densityCount[c.density as 'calm' | 'moderate' | 'busy']++
    })
    const densityData = [
      { name: 'Sakin', value: densityCount.calm, fill: densityLabel.calm.fill },
      { name: 'Orta', value: densityCount.moderate, fill: densityLabel.moderate.fill },
      { name: 'Yoğun', value: densityCount.busy, fill: densityLabel.busy.fill },
    ]

    return { total, monthSum, avg, last14, densityData }
  }, [cashList])

  function validate(): string | null {
    if (!form.title.trim()) return 'Lütfen işlemin ne olduğunu belirtin (Örn: Nakit Satış).'
    const amount = parseAmountInput(amountDisplay)
    if (!amountDisplay || amount <= 0) return 'Boş veya geçersiz kasa tutarı kaydedilemez.'
    if (amount > MAX_AMOUNT) return `Tutar ${MAX_AMOUNT.toLocaleString('tr-TR')} ₺ sınırını aşamaz.`
    const entryDate = new Date(form.date)
    const now = new Date()
    const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1)
    const oneYearLater = new Date(now); oneYearLater.setFullYear(now.getFullYear() + 1)
    if (entryDate < oneYearAgo || entryDate > oneYearLater) return 'Tarih mantıklı bir aralıkta olmalıdır (±1 yıl).'
    return null
  }

  async function handleSave() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)

    const body = {
      date: form.date,
      title: form.title.trim(),
      amount: parseAmountInput(amountDisplay),
      density: form.density || null,
    }

    if (editingId) {
      setCashList(prev => prev.map(c => c.id === editingId ? { ...c, ...body, density: body.density as Cash['density'] } : c))
      await fetch(`${BASE_URL}/cash/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setEditingId(null)
    } else {
      await fetch(`${BASE_URL}/cash`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      fetchCash()
    }
    setForm(emptyForm)
    setAmountDisplay('')
  }

  function handleEdit(c: Cash) {
    setError(null)
    setForm({ date: c.date, title: c.title || '', density: c.density || '' })
    setAmountDisplay(formatAmountInput(String(Math.round(c.amount))))
    setEditingId(c.id)
    document.getElementById('form-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setAmountDisplay('')
    setError(null)
  }

  async function handleDelete(id: number) {
    setCashList(prev => prev.filter(c => c.id !== id))
    setDeleteConfirmId(null)
    try {
      await fetch(`${BASE_URL}/cash/${id}`, { method: 'DELETE' })
    } catch {
      fetchCash()
    }
  }

  function exportCSV() {
    const rows = cashList.map(c =>
      `${c.date},"${c.title}",${c.amount},${c.density || ''}`
    )
    const csv = ['Tarih,Açıklama,Tutar,Yoğunluk', ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kasa-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F1E36] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50/50 w-full'

  const densityButtonCls: Record<string, string> = {
    calm: 'border-blue-200 text-blue-600 bg-blue-50/40 hover:bg-blue-50',
    moderate: 'border-amber-200 text-amber-600 bg-amber-50/40 hover:bg-amber-50',
    busy: 'border-emerald-200 text-emerald-600 bg-emerald-50/40 hover:bg-emerald-50',
  }

  const densityActiveCls: Record<string, string> = {
    calm: 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-100',
    moderate: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-100',
    busy: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-100',
  }

  const filteredCash = useMemo(() => {
    if (!cashSearch.trim()) return cashList
    return cashList.filter(c =>
      Object.values(c).some(value =>
        String(value).toLowerCase().includes(cashSearch.toLowerCase())
      )
    )
  }, [cashList, cashSearch])

  return (
    <div className="p-6 max-w-full mx-auto flex flex-col gap-6 text-[#0F1E36]">
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-2xl"><Trash2 size={22} className="text-red-500" /></div>
              <div>
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Kayıt Silinecek</p>
                <p className="text-base font-bold text-gray-900">Bu kasa verisini silmek istediğine emin misin?</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer">Vazgeç</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F1E36]">Kasa Yönetimi</h1>
          <p className="text-sm text-gray-500 font-medium">Finansal akış ve günlük doluluk takibi</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {rates && (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={14} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">USD / TRY</span>
                  <span className="text-sm font-bold text-[#0F1E36]">₺{fmt(rates.usd)}</span>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={14} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">EUR / TRY</span>
                  <span className="text-sm font-bold text-[#0F1E36]">₺{fmt(rates.eur)}</span>
                </div>
              </div>
            </>
          )}
          <button
            onClick={exportCSV}
            className="bg-green-600 border border-gray-200 text-white hover:bg-gray-500 px-4 ms-10 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            CSV İndir
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div id="form-area" className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-5 bg-violet-500 rounded-full" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                {editingId ? 'Kasa Kaydını Düzenle' : 'Yeni Günlük Kasa Girişi'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#555E6D] flex items-center gap-1">
                  <Tag size={13} /> İşlem / Açıklama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Günlük Mağaza Cirosu"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#555E6D] flex items-center gap-1">
                  <Wallet size={13} /> Tutar (₺) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={e => setAmountDisplay(formatAmountInput(e.target.value))}
                  placeholder="23.000.300"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#555E6D] flex items-center gap-1">
                  <Calendar size={13} /> Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#555E6D]">
                  İş Yeri Yoğunluğu
                  <span className="text-gray-400 font-normal ml-1">(opsiyonel)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 border border-gray-100 p-1 bg-gray-50 rounded-xl h-10.5 items-center">
                  {(['calm', 'moderate', 'busy'] as const).map(d => {
                    const isActive = form.density === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, density: isActive ? '' : d })}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer text-center ${isActive ? densityActiveCls[d] : `border-transparent text-gray-500 ${densityButtonCls[d]}`
                          }`}
                      >
                        {densityLabel[d].label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-4 border-t border-gray-50">
              <div className="flex-1 min-w-50">
                {error && (
                  <p className="text-sm text-red-500 font-semibold flex items-center gap-1.5">
                    <AlertCircle size={16} /> {error}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-violet-100 active:scale-[0.98] cursor-pointer"
                >
                  {editingId ? 'Değişiklikleri Güncelle' : 'Kasayı Kaydet'}
                </button>
              </div>
            </div>
          </div>

          {/* Liste */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h3 className="text-base font-bold text-[#0F1E36]">Kasa Giriş Geçmişi</h3>
              <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full">
                {cashList.length} Kayıt
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={cashSearch}
                onChange={e => setCashSearch(e.target.value)}
                placeholder="İşlem adına göre ara..."
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-[#0F1E36] placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-white"
              />
            </div>
            <div className="divide-y divide-gray-50 max-h-172.5 overflow-y-auto">
              {filteredCash.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-400">Henüz bir veri girişi yapılmadı.</p>
                </div>
              ) : (
                filteredCash.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-violet-50/10 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#0F1E36]">
                          {c.title || 'Belirtilmemiş İşlem'}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold mt-0.5">
                          {new Date(c.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      {c.density && densityLabel[c.density] && (
                        <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full h-fit ${densityLabel[c.density].color}`}>
                          {densityLabel[c.density].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-black text-[#0F1E36]">₺{fmt(c.amount)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 cursor-pointer transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(c.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {[
              { label: 'Toplam Kasa Bakiyesi', value: `₺${fmt(total)}`, color: 'border-violet-100 bg-gradient-to-br from-white to-violet-50/20', icon: <Wallet size={18} className="text-violet-500" /> },
              { label: 'Bu Ay Toplam Ciro', value: `₺${fmt(monthSum)}`, color: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/10', icon: <TrendingUp size={18} className="text-emerald-500" /> },
              { label: 'Aylık Günlük Ortalama', value: `₺${fmt(avg)}`, color: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/10', icon: <BarChart3 size={18} className="text-blue-500" /> },
            ].map(card => (
              <div key={card.label} className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between ${card.color}`}>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-black text-[#0F1E36] tracking-tight">{card.value}</p>
                </div>
                <div className="p-3 bg-white border border-gray-50 rounded-xl shadow-sm">{card.icon}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="w-full p-5 flex items-center justify-between font-bold text-sm bg-gray-50/40 text-gray-600 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={16} className="text-violet-500" /> KASA ANALİZ VE GRAFİKLERİ
              </span>
              {showCharts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCharts && (
              <div className="p-5 flex flex-col gap-6 bg-white">

                {last14.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Son 14 Günün Akışı</p>
                    <div className="w-full bg-gray-50/30 p-2 rounded-2xl border border-gray-100">
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={last14} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="gun" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(v) => [`₺${fmt(Number(v ?? 0))}`, 'Tutar']} contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#f3f4f6' }} />
                          <Area type="monotone" dataKey="tutar" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gradCash)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-gray-400">Grafik için yeterli veri yok.</div>
                )}

                {cashList.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yoğunluk Durum Dağılımı</p>
                    <div className="w-full bg-gray-50/30 p-2 rounded-2xl border border-gray-100">
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={densityData} barSize={32} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 700 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(v) => [v, 'Gün']} contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#f3f4f6' }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {densityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : null}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}