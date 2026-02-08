"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Building2,
  MapPin,
  Mail,
  Save,
  Bell,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type HotelData = {
  id: string;
  name: string | null;
  location: string | null;
  address: string | null;
  url: string | null;
  stars: number | null;
  photoUrl: string | null;
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const { isOpen } = useSidebar();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    nom: "",
    email: "",
    hotelUrl: "",
  });

  // Hotel data (scraped ou chargé)
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [isLoadingHotel, setIsLoadingHotel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractFailed, setExtractFailed] = useState(false);

  // Charger les données de l'hôtel et de l'utilisateur au montage
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;
        setIsLoadingHotel(true);

        // Charger les données de l'hôtel
        const hotelResponse = await fetch("/api/hotel");
        if (!isMounted) return;

        if (hotelResponse.ok) {
          const hotelData = await hotelResponse.json();
          if (!isMounted) return;

          setHotelData(hotelData);
          setProfileData((prev) => ({
            ...prev,
            hotelUrl: hotelData.url || "",
          }));
        }

        // Charger l'email de l'utilisateur depuis Supabase
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (user) {
          setProfileData((prev) => ({
            ...prev,
            email: user.email || "",
            nom: (user.user_metadata?.name as string) || "",
          }));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement:", error);
      } finally {
        if (isMounted) {
          setIsLoadingHotel(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    weeklyReport: true,
    monthlyReport: false,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mon compte</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles et préférences</p>
          </div>
        </header>

        <section className="flex-1 flex flex-col overflow-auto">
          {/* User Banner */}
          <div className="bg-primary text-primary-foreground px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <div className="text-xl font-semibold">Enzo Levieils-Spencer</div>
                <div className="text-sm opacity-90 mt-1">enzolevieilsspencer@gmail.com</div>
                <div className="text-sm opacity-75 mt-1">Membre depuis janvier 2026</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b bg-card px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("profil")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "profil"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Profil
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "notifications"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("securite")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "securite"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Sécurité
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === "profil" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Carte 1 : Informations du profil (gauche) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du profil</CardTitle>
                    <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="nom" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Nom complet
                      </label>
                      <Input 
                        id="nom" 
                        value={profileData.nom}
                        onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                      </label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="hotel-url" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        URL de mon hôtel (Booking.com)
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          id="hotel-url" 
                          placeholder="https://www.booking.com/hotel/..."
                          value={profileData.hotelUrl}
                          onChange={(e) => {
                            setProfileData({ ...profileData, hotelUrl: e.target.value });
                            setExtractFailed(false);
                          }}
                          disabled={isExtracting}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={async () => {
                            const url = (profileData.hotelUrl || "").trim();
                            if (!url) {
                              toast.error("Veuillez entrer l'URL Booking.com de votre hôtel");
                              return;
                            }
                            if (!url.includes("booking.com")) {
                              toast.error("Seules les URLs Booking.com sont supportées");
                              return;
                            }
                            setIsExtracting(true);
                            setExtractFailed(false);
                            try {
                              const res = await fetch("/api/competitors/extract-info", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url }),
                              });
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                setExtractFailed(true);
                                toast.error(err.error || "Extraction échouée (scraper indisponible ou timeout)");
                                return;
                              }
                              const data = await res.json();
                              setHotelData({
                                id: hotelData?.id ?? "",
                                name: (data.name ?? "Mon établissement").trim() || "Mon établissement",
                                location: (data.location ?? "").trim() || null,
                                address: (data.address ?? "").trim() || null,
                                url,
                                stars: typeof data.stars === "number" ? data.stars : null,
                                photoUrl: (data.photoUrl && typeof data.photoUrl === "string" ? data.photoUrl : null) || null,
                              });
                              setExtractFailed(false);
                              toast.success("Informations extraites avec succès");
                            } catch (e) {
                              setExtractFailed(true);
                              toast.error("Erreur lors de l'extraction");
                            } finally {
                              setIsExtracting(false);
                            }
                          }}
                          disabled={isExtracting}
                        >
                          {isExtracting ? "Extraction..." : "Extraire"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Collez l'URL de votre hôtel, cliquez sur « Extraire » pour récupérer nom, adresse et photo, puis « Enregistrer » pour sauvegarder en tant qu'hôtel client.
                      </p>
                      {extractFailed && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Le scraper est indisponible. Vous pouvez quand même enregistrer avec un nom par défaut « Mon établissement » (modifiable plus tard).
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={async () => {
                          const url = (profileData.hotelUrl || "").trim();
                          if (!url) {
                            toast.error("Veuillez entrer l'URL Booking.com de votre hôtel");
                            return;
                          }
                          if (!url.includes("booking.com")) {
                            toast.error("Seules les URLs Booking.com sont supportées");
                            return;
                          }
                          setIsSaving(true);
                          try {
                            const response = await fetch("/api/hotel", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                url,
                                name: hotelData?.name?.trim() || "Mon établissement",
                                location: hotelData?.location ?? undefined,
                                address: hotelData?.address ?? undefined,
                                stars: hotelData?.stars ?? undefined,
                                photoUrl: hotelData?.photoUrl ?? undefined,
                              }),
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || "Erreur lors de l'enregistrement");
                            }

                            const updated = await response.json();
                            setHotelData(updated);
                            setProfileData((prev) => ({ ...prev, hotelUrl: updated.url || url }));
                            toast.success("Hôtel enregistré avec succès (enregistré en tant que client)");
                          } catch (error) {
                            console.error("Erreur lors de l'enregistrement:", error);
                            toast.error(
                              error instanceof Error 
                                ? error.message 
                                : "Erreur lors de l'enregistrement"
                            );
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Carte 2 : Mon hôtel (droite) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mon hôtel</CardTitle>
                    <CardDescription>Informations de votre hôtel (extrait depuis l'URL à gauche)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHotel ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Chargement des informations de l'hôtel...
                      </div>
                    ) : hotelData && (hotelData.name || hotelData.location) ? (
                      <>
                        <div className="mb-4">
                          {hotelData.photoUrl ? (
                            <img 
                              src={hotelData.photoUrl} 
                              alt={hotelData.name || "Hôtel"}
                              className="h-64 w-full rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-64 w-full rounded-lg bg-muted flex items-center justify-center ${hotelData.photoUrl ? 'hidden' : ''}`}>
                            <Building2 className="h-16 w-16 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{hotelData.name || "Nom non disponible"}</h3>
                            {hotelData.stars && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: hotelData.stars }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                ))}
                              </div>
                            )}
                          </div>
                          {hotelData.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{hotelData.location}</span>
                            </div>
                          )}
                          {hotelData.address && (
                            <div className="text-sm text-muted-foreground">
                              {hotelData.address}
                            </div>
                          )}
                          {hotelData.url && (
                            <div className="flex items-center gap-2">
                              <a
                                href={hotelData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Voir sur Booking.com
                              </a>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p>Aucune information d'hôtel disponible</p>
                        <p className="text-xs mt-1">Entrez une URL Booking.com dans la carte à gauche et enregistrez</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Préférences de notification</CardTitle>
                  <CardDescription>Choisissez comment vous souhaitez être notifié</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Alertes de prix */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="font-semibold text-foreground">Alertes de prix</div>
                          <div className="text-sm text-muted-foreground">Recevez des notifications instantanées lors de baisses ou hausses de prix.</div>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.priceAlerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, priceAlerts: checked })}
                      />
                    </div>

                    {/* Rapport hebdomadaire */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <div>
                          <div className="font-semibold text-foreground">Rapport hebdomadaire</div>
                          <div className="text-sm text-muted-foreground">Recevez un résumé des performances de vos concurrents chaque semaine.</div>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.weeklyReport}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                      />
                    </div>

                    {/* Rapport mensuel */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <div>
                          <div className="font-semibold text-foreground">Rapport mensuel</div>
                          <div className="text-sm text-muted-foreground">Recevez une analyse approfondie des tendances du marché chaque mois.</div>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.monthlyReport}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, monthlyReport: checked })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={() => {
                      toast.success("Préférences de notification enregistrées");
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "securite" && (
              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez la sécurité de votre compte</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Section sécurité à venir...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
