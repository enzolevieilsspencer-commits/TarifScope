import type { Metadata } from "next";
import { SidebarProvider } from "@/components/sidebar-context";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Positionnement prix vs concurrents",
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}
