"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  User,
  Building2,
  MapPin,
  Mail,
  Save,
  Bell
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const { isOpen } = useSidebar();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    nom: "Enzo Levieils-Spencer",
    societe: "Ma Société",
    ville: "Paris",
    email: "enzolevieilsspencer@gmail.com",
    hotel: "Hôtel Example",
  });

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
              <Card>
                <CardHeader>
                  <CardTitle>Informations du profil</CardTitle>
                  <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="nom" className="text-sm font-medium text-foreground flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Nom complet
                        </label>
                        <Input 
                          id="nom" 
                          value={profileData.nom}
                          onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="societe" className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Société
                        </label>
                        <Input 
                          id="societe" 
                          value={profileData.societe}
                          onChange={(e) => setProfileData({ ...profileData, societe: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="ville" className="text-sm font-medium text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Ville
                        </label>
                        <Input 
                          id="ville" 
                          value={profileData.ville}
                          onChange={(e) => setProfileData({ ...profileData, ville: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
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
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="hotel" className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Mon hôtel
                        </label>
                        <Input 
                          id="hotel" 
                          value={profileData.hotel}
                          onChange={(e) => setProfileData({ ...profileData, hotel: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={() => {
                      toast.success("Profil enregistré avec succès");
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
