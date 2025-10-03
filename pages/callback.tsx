import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // Let Supabase handle the redirect and then go back to home
    supabase.auth.getSession().then(() => {
      router.push("/");
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Processing callback...</h2>
    </div>
  );
}
