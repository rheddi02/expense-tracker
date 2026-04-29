import { Home, Wallet, User } from 'lucide-react'

type Tab = 'dashboard' | 'transactions' | 'profile'

type Props = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabNavigation({ activeTab, onTabChange }: Props) {
  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={24} /> },
    { id: 'transactions', label: 'Transactions', icon: <Wallet size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white sm:static">
      <nav className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'text-slate-950'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
