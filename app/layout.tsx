import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "TarifScope — Veille concurrentielle hôtellerie",
    template: "%s | TarifScope",
  },
  description:
    "Surveille tes concurrents, reçois des alertes et optimise tes prix (historique, exports, multi-hôtels).",
  robots: { index: true, follow: true },
  openGraph: {
    title: "TarifScope",
    description: "Veille concurrentielle hôtellerie + alertes prix.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
