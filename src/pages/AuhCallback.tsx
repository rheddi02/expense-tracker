import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (data.session) {
        navigate("/"); // change to your route
      } else {
        navigate("/login");
      }
    };

    handleAuth();
  }, [navigate]);

  return <p>Signing you in...</p>;
}