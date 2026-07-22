import type { ReactNode } from "react";
import { useState } from "react";
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Mail, Shield } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: "dashboard" | "users" | "settings" | "contact";
  onTabChange: (tab: "dashboard" | "users" | "settings" | "contact") => void;
  onLogout: () => void;
}

const tabs = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "users" as const, label: "Users", icon: Users },
  { id: "contact" as const, label: "Contact", icon: Mail },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export const AdminLayout = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
}: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Mobile Menu Bar */}
      <div className="lg:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-400" />
          <h1 className="text-base font-bold tracking-tight">Admin</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } lg:block lg:w-64 w-full bg-gray-900 text-white flex flex-col absolute lg:static top-[49px] left-0 right-0 z-40 lg:z-auto lg:h-full`}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-2.5 px-6 py-5 border-b border-gray-800">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield size={16} className="text-white" />
          </div>
          <h1 className="text-base font-bold tracking-tight">Admin Panel</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (Desktop) */}
        <div className="hidden lg:flex items-center bg-card border-b border-border px-8 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
