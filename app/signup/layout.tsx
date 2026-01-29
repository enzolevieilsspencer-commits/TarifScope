import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Si l'utilisateur est déjà connecté, rediriger vers /app
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return <>{children}</>;
}
