import { Home, Wallet, User, Users } from 'lucide-react'

type Tab = 'dashboard' | 'transactions' | 'debts' | 'profile'

type Props = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={24} /> },
  { id: 'transactions', label: 'Transactions', icon: <Wallet size={24} /> },
  { id: 'debts', label: 'Debts', icon: <Users size={24} /> },
  { id: 'profile', label: 'Profile', icon: <User size={24} /> },
]

export default function TabNavigation({ activeTab, onTabChange }: Props) {

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card sm:static">
      <nav className="flex justify-around">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
