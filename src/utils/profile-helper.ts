import { supabase } from "@/lib/supabase";

export async function getProfile() {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.session.user.id)
    .single();

  if (error) return null;

  return data;
}