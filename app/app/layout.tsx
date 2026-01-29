import type { Metadata } from "next";
import { SidebarProvider } from "@/components/sidebar-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Positionnement prix vs concurrents",
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifier l'authentification dans le layout
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/app");
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}
