import { supabase } from "@/lib/supabase";

export async function getProfile() {
  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      // Try to return cached profile if offline
      const cachedProfile = localStorage.getItem('cached_profile');
      return cachedProfile ? JSON.parse(cachedProfile) : null;
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
        return JSON.parse(cachedProfile);
      }
      return null;
    }

    // Cache successful profile fetch
    if (data) {
      localStorage.setItem('cached_profile', JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.warn("Profile fetch error:", error);
    // Return cached profile on any error
    const cachedProfile = localStorage.getItem('cached_profile');
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  }
}