import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpotifyLogin() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Filtros para recently played
  const [dateFilter, setDateFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [albumFilter, setAlbumFilter] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const token = (data.session as any).provider_token;
          if (token) {
            setProviderToken(token);
            fetchProfile(token);
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    checkSession();
  }, []);

  const loginWithSpotify = async () => {
    if (isLoading) return;

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

  const fetchEndpoint = async (endpoint: string, params?: Record<string, string>) => {
    if (!providerToken) {
      setError("No hay token disponible");
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      let url = `http://localhost:3000${endpoint}`;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      setApiResponse(data);
      
      if (!res.ok) throw new Error(data.error || 'Error en la petición');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Spotify Tracker</h1>
      
      {error && (
        <div style={{ color: "red", marginBottom: "1rem", padding: 10, background: '#ffebee' }}>
          {error}
        </div>
      )}

      {!userProfile ? (
        <button
          onClick={loginWithSpotify}
          disabled={isLoading}
          style={{ 
            opacity: isLoading ? 0.7 : 1,
            padding: '10px 20px',
            background: '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: 4
          }}
        >
          {isLoading ? "Cargando..." : "Login with Spotify"}
        </button>
      ) : (
        <div>
          {/* Perfil */}
          <div style={{ marginBottom: 20, padding: 15, background: '#f5f5f5', borderRadius: 4 }}>
            <h2>Hola, {userProfile.display_name}</h2>
            <p>Email: {userProfile.email}</p>
            {userProfile.images?.[0]?.url && (
              <img 
                src={userProfile.images[0].url} 
                alt="Avatar" 
                width={100} 
                style={{ borderRadius: '50%' }}
              />
            )}
          </div>

          {/* Endpoints Testing */}
          <div style={{ marginTop: 20 }}>
            <h3>Probar Endpoints</h3>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button 
                onClick={() => fetchEndpoint('/me')}
                disabled={isLoading}
                style={{ padding: '8px 16px' }}
              >
                Get Profile
              </button>
              
              <button 
                onClick={() => fetchEndpoint('/my-playlists')}
                disabled={isLoading}
                style={{ padding: '8px 16px' }}
              >
                Get Playlists
              </button>
            </div>

            {/* Recently Played Filters */}
            <div style={{ marginTop: 15, padding: 15, background: '#f5f5f5', borderRadius: 4 }}>
              <h4>Recently Played Filters</h4>
              
              <div style={{ marginBottom: 10 }}>
                <label>
                  Date:
                  <input
                    type="datetime-local"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ marginLeft: 10 }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>
                  Artist:
                  <input
                    type="text"
                    value={artistFilter}
                    onChange={(e) => setArtistFilter(e.target.value)}
                    style={{ marginLeft: 10 }}
                    placeholder="Filter by artist name"
                  />
                </label>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>
                  Album:
                  <input
                    type="text"
                    value={albumFilter}
                    onChange={(e) => setAlbumFilter(e.target.value)}
                    style={{ marginLeft: 10 }}
                    placeholder="Filter by album name"
                  />
                </label>
              </div>

              <button
                onClick={() => {
                  const params: Record<string, string> = {};
                  if (dateFilter) params.date = new Date(dateFilter).toISOString();
                  if (artistFilter) params.artist = artistFilter;
                  if (albumFilter) params.album = albumFilter;
                  fetchEndpoint('/recently-played', params);
                }}
                disabled={isLoading}
                style={{ padding: '8px 16px' }}
              >
                Get Recently Played
              </button>
            </div>

            {/* API Response */}
            {apiResponse && (
              <div style={{ marginTop: 20 }}>
                <h4>Response:</h4>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: 15, 
                  borderRadius: 4,
                  overflowX: 'auto' 
                }}>
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
