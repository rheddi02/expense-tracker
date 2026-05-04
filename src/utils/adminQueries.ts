import { supabase } from "@/lib/supabase";

export interface UserStats {
  total: number;
  pending: number;
  allowed: number;
  blocked: number;
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "blocked";
  created_at: string;
}

// Get user status statistics
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("status");

    if (error) throw error;

    const stats: UserStats = {
      total: data?.length || 0,
      pending: data?.filter((u) => u.status === "pending").length || 0,
      allowed: data?.filter((u) => u.status === "allowed").length || 0,
      blocked: data?.filter((u) => u.status === "blocked").length || 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { total: 0, pending: 0, allowed: 0, blocked: 0 };
  }
};

// Get user growth data (last 30 days)
export const getUserGrowthData = async (): Promise<UserGrowthData[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped: Record<string, number> = {};
    data?.forEach((profile) => {
      const date = new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return [];
  }
};

// Get role distribution
export const getRoleDistribution = async (): Promise<RoleDistribution[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role");

    if (error) throw error;

    const adminCount = data?.filter((u) => u.role === "admin").length || 0;
    const userCount = data?.filter((u) => u.role === "user").length || 0;

    return [
      { role: "Admin", count: adminCount },
      { role: "User", count: userCount },
    ];
  } catch (error) {
    console.error("Error fetching role distribution:", error);
    return [];
  }
};

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Update user status
export const updateUserStatus = async (
  userId: string,
  status: "pending" | "approved" | "blocked"
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating user status:", error);
    return false;
  }
};

export interface AppSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

const APP_SETTINGS_KEY = "global";

export const getAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("maintenance_mode,registration_enabled")
      .eq("id", APP_SETTINGS_KEY)
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        // Table does not exist yet
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      maintenanceMode: data.maintenance_mode ?? false,
      registrationEnabled: data.registration_enabled ?? true,
    };
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
};

export const upsertAppSettings = async (
  settings: AppSettings,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        {
          id: APP_SETTINGS_KEY,
          maintenance_mode: settings.maintenanceMode,
          registration_enabled: settings.registrationEnabled,
        },
        { onConflict: "id" }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving app settings:", error);
    return false;
  }
};
