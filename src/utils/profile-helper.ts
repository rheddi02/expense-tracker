import { supabase } from "@/lib/supabase";

export async function getProfile() {
  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      // Try to return cached profile if offline or no user session
      const cachedProfile = localStorage.getItem('cached_profile');
      if (cachedProfile) {
        try {
          return JSON.parse(cachedProfile);
        } catch (e) {
          console.warn("Invalid cached profile format, removing");
          localStorage.removeItem('cached_profile');
        }
      }
      return null;
    }

    const user = userData.user;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.warn("Profile fetch error:", error.message);
      // Return cached profile if fetch fails (offline scenario)
      const cachedProfile = localStorage.getItem('cached_profile');
      if (cachedProfile) {
        try {
          return JSON.parse(cachedProfile);
        } catch (e) {
          console.warn("Invalid cached profile format");
          localStorage.removeItem('cached_profile');
        }
      }
      return null;
    }

    // Cache successful profile fetch with status for offline access
    if (data) {
      localStorage.setItem('cached_profile', JSON.stringify(data));
      console.log("Profile cached with status:", data.status);
    }

    return data;
  } catch (error) {
    console.warn("Profile fetch error:", error);
    // Return cached profile on any error
    const cachedProfile = localStorage.getItem('cached_profile');
    if (cachedProfile) {
      try {
        return JSON.parse(cachedProfile);
      } catch (e) {
        console.warn("Invalid cached profile format");
        localStorage.removeItem('cached_profile');
      }
    }
    return null;
  }
}