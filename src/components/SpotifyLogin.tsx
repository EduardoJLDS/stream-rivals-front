import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpotifyLogin() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revisar si hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const providerToken = data.session.provider_token;
          if (providerToken) fetchProfile(providerToken);
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    checkSession();
  }, []);

  const loginWithSpotify = async () => {
    if (isLoading) return; // Prevenir múltiples clics

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: {
          scopes: "user-read-private user-read-email user-read-recently-played",
        },
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión");
      // Esperar 8 segundos antes de permitir otro intento
      setTimeout(() => {
        setIsLoading(false);
      }, 8000);
    }
  };

  const fetchProfile = async (providerToken: string) => {
    try {
      const res = await fetch("http://localhost:3000/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_token: providerToken }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setUserProfile(data.profile);
    } catch (error: any) {
      setError(error.message || "Error al obtener el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Spotify Tracker</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      {!userProfile ? (
        <button
          onClick={loginWithSpotify}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Cargando..." : "Login with Spotify"}
        </button>
      ) : (
        <div>
          <h2>Hola, {userProfile.display_name}</h2>
          <p>Email: {userProfile.email}</p>
          {userProfile.images?.[0]?.url && (
            <img src={userProfile.images[0].url} alt="Avatar" width={150} />
          )}
        </div>
      )}
    </div>
  );
}
