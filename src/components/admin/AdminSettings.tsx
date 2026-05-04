import { useState } from "react";
import { toast } from "sonner";

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      // Mock save - replace with actual Supabase save if needed
      console.log("Saving settings:", settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Settings Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900!">
            Admin Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Maintenance Mode
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Disable access for regular users while maintenance is ongoing
              </p>
            </div>
            <label className="flex cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle("maintenanceMode")}
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? "bg-red-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Registration Enabled */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-200 gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Allow New Registrations
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Enable or disable new user sign-ups
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registrationEnabled}
                  onChange={() => handleToggle("registrationEnabled")}
                  className="sr-only"
                />
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.registrationEnabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.registrationEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Email Notifications
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Send email notifications for important events
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                  className="sr-only"
                />
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
        <button
          onClick={() => setSettings({
            maintenanceMode: false,
            registrationEnabled: true,
            emailNotifications: true,
          })}
          className="px-4 sm:px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition text-sm sm:text-base"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-4 sm:px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition text-sm sm:text-base"
        >
          Save Settings
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-red-900">Danger Zone</h3>
        <p className="text-xs sm:text-sm text-red-700 mt-2 leading-relaxed">
          These actions are irreversible. Please proceed with caution.
        </p>
        <button className="mt-4 px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition text-sm sm:text-base">
          Clear All Cache
        </button>
      </div>
    </div>
  );
};
