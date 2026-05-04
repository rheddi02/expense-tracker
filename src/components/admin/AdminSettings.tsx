import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/Auth/password-input";
import { updatePassword } from "@/auth/authService";
import { supabase } from "@/lib/supabase";
import { ChevronDown } from "lucide-react";

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

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

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.currentPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password by trying to sign in
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error("Unable to verify user");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsChangingPassword(false);
        return;
      }

      // Update password
      await updatePassword(passwordForm.newPassword);
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
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

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-left">
          {/* Maintenance Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-200 gap-3 sm:gap-4">
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
            <div className="shrink-0">
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
            <div className="shrink-0">
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

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-left">
        <button
          onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
          className="w-full p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900!">
              Change Password
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update your admin account password
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform shrink-0 ml-4 ${
              isPasswordExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isPasswordExpanded && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <PasswordInput
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter current password"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <PasswordInput
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <PasswordInput
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
              />
            </div>

            {/* Change Password Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() =>
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition text-sm"
                disabled={isChangingPassword}
              >
                Clear
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        )}
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
