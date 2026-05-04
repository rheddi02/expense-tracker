import { supabase } from "@/lib/supabase";

export async function getProfile() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  const user = userData.user;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn("Profile fetch error:", error.message);
    return null;
  }

  return data;
}