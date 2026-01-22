import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Bell,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Hotel,
  Users,
  History,
  DollarSign,
} from "lucide-react";
import { DashboardPreview } from "@/components/dashboard-preview";

export const metadata: Metadata = {
  title: "TarifScope — Veille concurrentielle hôtellerie",
  description:
    "Surveillez automatiquement les prix de vos concurrents, recevez des alertes en temps réel et optimisez votre stratégie tarifaire. La solution SaaS pour l'hôtellerie.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hotel className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-xl sm:text-2xl md:text-2xl font-bold tracking-tight">TarifScope</span>
          </div>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm">
            <Link href="#" className="text-foreground hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/login"
              className="hidden sm:inline-flex relative items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-foreground bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-300/60 hover:bg-white/95 hover:border-gray-400/80 transition-all duration-300"
            >
              Connexion
            </Link>
            <Link 
              href="/signup"
              className="relative inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3b82f6]/90 backdrop-blur-md rounded-full border-2 border-white/40 hover:bg-[#2563eb]/90 hover:border-white/60 transition-all duration-300"
            >
              Découvrez TarifScope
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-20 sm:pb-24 md:pb-32 lg:pb-40">
        {/* Vector Background - Elegant Effect */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: '65%' }}>
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 400"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Radial Gradient for Glow Effect */}
              <radialGradient id="glow1" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
              
              <radialGradient id="glow2" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#2563eb" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </radialGradient>
              
              {/* Linear Gradient for Light Beam */}
              <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.08" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
              
              {/* Mesh Gradient for Depth */}
              <linearGradient id="mesh" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
              </linearGradient>

              {/* Bottom Fade Gradient to blend vector into background */}
              <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Light Beam Effect */}
            <rect
              x="0"
              y="0"
              width="1440"
              height="400"
              fill="url(#beam)"
            />
            
            {/* Mesh Overlay */}
            <rect
              x="0"
              y="0"
              width="1440"
              height="400"
              fill="url(#mesh)"
            />
            
            {/* Glow Circles - Top Left */}
            <circle cx="200" cy="150" r="300" fill="url(#glow1)" style={{ animation: 'float 8s ease-in-out infinite' }} />
            <circle cx="200" cy="150" r="200" fill="url(#glow2)" style={{ animation: 'pulse 6s ease-in-out infinite' }} />
            
            {/* Glow Circles - Top Right */}
            <circle cx="1200" cy="200" r="280" fill="url(#glow1)" style={{ animation: 'floatReverse 10s ease-in-out infinite' }} />
            <circle cx="1200" cy="200" r="180" fill="url(#glow2)" style={{ animation: 'pulse 7s ease-in-out infinite 1s' }} />
            
            {/* Glow Circles - Bottom Center */}
            <circle cx="720" cy="350" r="350" fill="url(#glow1)" style={{ animation: 'float 12s ease-in-out infinite 2s' }} />
            <circle cx="720" cy="350" r="250" fill="url(#glow2)" style={{ animation: 'pulse 8s ease-in-out infinite 1.5s' }} />
            
            {/* Subtle Grid Pattern */}
            <pattern
              id="subtleGrid"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="40" cy="40" r="1" fill="#3b82f6" opacity="0.1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#subtleGrid)" />
            
            {/* Geometric Shapes - Subtle Accents */}
            <polygon
              points="100,100 150,50 200,100 150,150"
              fill="#3b82f6"
              opacity="0.05"
              transform="rotate(45 150 100)"
              style={{ animation: 'rotate 20s linear infinite' }}
            />
            <polygon
              points="1300,300 1350,250 1400,300 1350,350"
              fill="#2563eb"
              opacity="0.04"
              transform="rotate(-45 1350 300)"
              style={{ animation: 'rotate 25s linear infinite reverse' }}
            />
            
            {/* Small Squares - Scattered with Animations */}
            <rect x="50" y="50" width="24" height="24" fill="#3b82f6" opacity="0.2" rx="4" style={{ animation: 'float 6s ease-in-out infinite' }} />
            <rect x="300" y="80" width="22" height="22" fill="#2563eb" opacity="0.18" rx="4" style={{ animation: 'floatReverse 8s ease-in-out infinite 0.5s' }} />
            <rect x="550" y="120" width="28" height="28" fill="#3b82f6" opacity="0.22" rx="5" style={{ animation: 'fadeInOut 4s ease-in-out infinite' }} />
            <rect x="800" y="60" width="20" height="20" fill="#2563eb" opacity="0.16" rx="3" style={{ animation: 'slide 7s ease-in-out infinite' }} />
            <rect x="1050" y="100" width="26" height="26" fill="#3b82f6" opacity="0.19" rx="4" style={{ animation: 'float 9s ease-in-out infinite 1s' }} />
            <rect x="1300" y="140" width="24" height="24" fill="#2563eb" opacity="0.18" rx="4" style={{ animation: 'floatReverse 6.5s ease-in-out infinite 0.3s' }} />
            <rect x="150" y="180" width="30" height="30" fill="#3b82f6" opacity="0.21" rx="5" style={{ animation: 'fadeInOut 5s ease-in-out infinite 1s' }} />
            <rect x="450" y="220" width="22" height="22" fill="#2563eb" opacity="0.17" rx="4" style={{ animation: 'drift 8s ease-in-out infinite 0.7s' }} />
            <rect x="700" y="200" width="20" height="20" fill="#3b82f6" opacity="0.15" rx="3" style={{ animation: 'float 7s ease-in-out infinite 0.3s' }} />
            <rect x="950" y="240" width="24" height="24" fill="#2563eb" opacity="0.19" rx="4" style={{ animation: 'floatReverse 6s ease-in-out infinite 0.8s' }} />
            <rect x="1200" y="200" width="22" height="22" fill="#3b82f6" opacity="0.17" rx="4" style={{ animation: 'fadeInOut 5.5s ease-in-out infinite 0.2s' }} />
            <rect x="200" y="280" width="26" height="26" fill="#2563eb" opacity="0.2" rx="4" style={{ animation: 'slide 8s ease-in-out infinite 0.5s' }} />
            <rect x="500" y="300" width="20" height="20" fill="#3b82f6" opacity="0.16" rx="3" style={{ animation: 'float 6.5s ease-in-out infinite 1.2s' }} />
            <rect x="850" y="280" width="28" height="28" fill="#2563eb" opacity="0.21" rx="5" style={{ animation: 'floatReverse 7.5s ease-in-out infinite 0.4s' }} />
            <rect x="1100" y="320" width="24" height="24" fill="#3b82f6" opacity="0.18" rx="4" style={{ animation: 'fadeInOut 4.5s ease-in-out infinite 0.9s' }} />
            <rect x="1350" y="300" width="22" height="22" fill="#2563eb" opacity="0.17" rx="4" style={{ animation: 'drift 7s ease-in-out infinite 0.6s' }} />
            <rect x="100" y="340" width="24" height="24" fill="#3b82f6" opacity="0.19" rx="4" style={{ animation: 'float 8.5s ease-in-out infinite 1.1s' }} />
            <rect x="400" y="360" width="20" height="20" fill="#2563eb" opacity="0.15" rx="3" style={{ animation: 'floatReverse 6.8s ease-in-out infinite 0.7s' }} />

            {/* Bottom white fade so the vector background disappears smoothly */}
            <rect x="0" y="260" width="1440" height="140" fill="url(#bottomFade)" />
          </svg>
        </div>
        
        <div className="container relative z-10 px-4 sm:px-6 mx-auto max-w-7xl">
          {/* Text Content - Centered */}
          <div className="mx-auto max-w-4xl text-center mb-12 sm:mb-16 md:mb-20">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl px-2">
              Veille Concurrentielle
              <br />
              <span className="text-primary">Automatisée</span> pour l'Hôtellerie
            </h1>
            <p className="mx-auto mt-6 sm:mt-8 md:mt-10 max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground px-4">
              Surveillez automatiquement les prix de vos concurrents et optimisez votre stratégie tarifaire en temps réel.
            </p>
            <div className="mt-10 sm:mt-12 md:mt-16 flex items-center justify-center px-4">
              <Link 
                href="/signup"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-[#3b82f6]/90 backdrop-blur-md rounded-full border-2 border-white/40 hover:bg-[#2563eb]/90 hover:border-white/60 transition-all duration-300 w-full sm:w-auto"
              >
                Commencer gratuitement
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </div>
          </div>

          {/* Dashboard Preview - Below CTA */}
          <div className="mx-auto max-w-5xl mt-12 sm:mt-16">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20">
        <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12 md:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Veille concurrentielle et surveillance des prix pour l'hôtellerie
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
              Des outils puissants pour surveiller, analyser et optimiser votre stratégie tarifaire
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-6xl">
            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Surveillance automatique</CardTitle>
                <CardDescription className="text-center">
                  Scans automatiques plusieurs fois par jour pour suivre les prix de vos concurrents en temps réel
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Alertes intelligentes</CardTitle>
                <CardDescription className="text-center">
                  Recevez des notifications instantanées lors de baisses de prix, hausses ou changements de disponibilité
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Analyses approfondies</CardTitle>
                <CardDescription className="text-center">
                  Graphiques, tendances et indicateurs clés pour comprendre l'évolution du marché
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Historique complet</CardTitle>
                <CardDescription className="text-center">
                  Conservez un historique détaillé de tous les prix pour analyser les tendances sur le long terme
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Export des données</CardTitle>
                <CardDescription className="text-center">
                  Exportez vos données en CSV pour des analyses approfondies dans Excel ou vos outils BI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Sécurisé et fiable</CardTitle>
                <CardDescription className="text-center">
                  Vos données sont protégées avec un chiffrement de niveau entreprise et une disponibilité garantie
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 md:py-20">
        <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8 sm:mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Questions fréquentes</h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
                Tout ce que vous devez savoir sur TarifScope
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment fonctionne la surveillance des prix ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    TarifScope scanne automatiquement les sites de réservation de vos concurrents plusieurs fois par jour.
                    Les données sont collectées, normalisées et analysées pour vous fournir des insights actionnables.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puis-je essayer gratuitement ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oui ! Nous offrons un essai gratuit de 14 jours sans carte bancaire. Vous pouvez tester toutes les
                    fonctionnalités et voir comment TarifScope peut transformer votre stratégie tarifaire.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quels sites de réservation sont surveillés ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous surveillons les principaux sites de réservation (Booking.com, Expedia, Hotels.com, etc.) ainsi
                    que les sites web directs de vos concurrents. La liste complète est disponible dans votre dashboard.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mes données sont-elles sécurisées ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Absolument. Nous utilisons un chiffrement de niveau entreprise, des sauvegardes régulières et
                    respectons strictement le RGPD. Vos données ne sont jamais partagées avec des tiers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Prêt à optimiser votre stratégie tarifaire ?
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-primary-foreground/90">
              Rejoignez les centaines d'hôtels qui font confiance à TarifScope
            </p>
            <div className="mt-8 sm:mt-10">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                <Link href="/signup">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-12">
        <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Hotel className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold tracking-tight">TarifScope</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La solution de veille concurrentielle pour l'hôtellerie
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Sécurité
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© 2025 TarifScope. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
