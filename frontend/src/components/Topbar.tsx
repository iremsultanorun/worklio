'use client'

import { Search, Bell, User } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
    const [search, setSearch] = useState('')

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end gap-8 px-6 shrink-0">
            <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 border border-gray-200 bg-gray-100 focus-within:border-gray-400 focus-within:bg-white rounded-lg px-3 py-2">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-md text-gray-600 outline-none w-full placeholder:text-gray-400"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button aria-label='bildirimler' className="transition-all duration-200 ease p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-600">
                    <Bell size={18} />
                </button>
                <button aria-label='giriş yap' className="transition-all duration-200 ease p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-600">
                    <User size={18} />
                </button>
            </div>
        </header>
    )
}