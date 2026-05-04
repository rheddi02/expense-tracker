import type { ReactNode } from "react";
import { useState } from "react";
import { LayoutDashboard, Users, Settings, LogOut, Menu, X } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: "dashboard" | "users" | "settings";
  onTabChange: (tab: "dashboard" | "users" | "settings") => void;
  onLogout: () => void;
}

const tabs = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "users" as const, label: "Users", icon: Users },
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
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      {/* Mobile/Tablet Menu Button */}
      <div className="lg:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3">
        <h1 className="text-lg font-bold">Admin</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-800 rounded transition"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } lg:block lg:w-64 w-full bg-gray-900 text-white flex flex-col absolute lg:static top-16 left-0 right-0 z-40 lg:z-auto lg:h-full`}
      >
        {/* Header (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (Desktop Only) */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-6 lg:px-8 py-3 lg:py-4">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
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
