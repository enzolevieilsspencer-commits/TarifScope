"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Settings,
  RefreshCw,
  Calendar,
  Bell,
  Save,
  Clock
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";
import { z } from "zod";

const settingsSchema = z.object({
  frequency: z.string().min(1, "La fréquence est requise"),
  monitoredDates: z.array(z.string()).min(1, "Au moins une date doit être surveillée"),
  alertThreshold: z.string().min(1, "Le seuil est requis").refine((val) => !isNaN(Number(val)), "Le seuil doit être un nombre"),
  alertThresholdType: z.enum(["euro", "percent"]),
  alertCooldown: z.string().min(1, "Le cooldown est requis").refine((val) => !isNaN(Number(val)), "Le cooldown doit être un nombre"),
});

export default function SettingsPage() {
  const { isOpen } = useSidebar();
  
  const [settings, setSettings] = useState({
    frequency: "1",
    monitoredDates: ["7", "14", "30"],
    alertThreshold: "10",
    alertThresholdType: "percent" as "euro" | "percent",
    alertCooldown: "60",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    try {
      settingsSchema.parse({
        frequency: settings.frequency,
        monitoredDates: settings.monitoredDates,
        alertThreshold: settings.alertThreshold,
        alertThresholdType: settings.alertThresholdType,
        alertCooldown: settings.alertCooldown,
      });
      setErrors({});
      localStorage.setItem("settings-configured", "true");
      toast.success("Paramètres de veille enregistrés avec succès");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path && err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Veuillez corriger les erreurs du formulaire");
      }
    }
  };

  const toggleMonitoredDate = (date: string) => {
    if (settings.monitoredDates.includes(date)) {
      if (settings.monitoredDates.length > 1) {
        setSettings({
          ...settings,
          monitoredDates: settings.monitoredDates.filter(d => d !== date),
        });
      } else {
        toast.error("Au moins une date doit être surveillée");
      }
    } else {
      setSettings({
        ...settings,
        monitoredDates: [...settings.monitoredDates, date],
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Paramètres de veille</h1>
            <p className="text-sm text-muted-foreground mt-1">Configurez la surveillance automatique des prix</p>
          </div>
        </header>

        <section className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Frequency Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <CardTitle>Fréquence de scan</CardTitle>
              </div>
              <CardDescription>
                Un scan automatique par jour (vers midi, heure de Paris). Vous pouvez aussi lancer un scan manuel depuis le tableau de bord.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Nombre de scans par jour</Label>
                <Select
                  value={settings.frequency}
                  onValueChange={(value) => setSettings({ ...settings, frequency: value })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 scan par jour (recommandé)</SelectItem>
                    <SelectItem value="2">2 scans par jour (plan Pro)</SelectItem>
                    <SelectItem value="4">4 scans par jour (plan Pro)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.frequency && (
                  <p className="text-sm text-destructive">{errors.frequency}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Avec le plan Hobby Vercel, un seul scan automatique par jour est exécuté.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monitored Dates Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Dates surveillées</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez les dates à l'avance pour lesquelles les prix seront surveillés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Label>Dates à surveiller</Label>
                <div className="space-y-2">
                  {[
                    { value: "7", label: "J+7 (7 jours à l'avance)" },
                    { value: "14", label: "J+14 (14 jours à l'avance)" },
                    { value: "30", label: "J+30 (30 jours à l'avance)" },
                  ].map((date) => (
                    <div key={date.value} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor={`date-${date.value}`} className="cursor-pointer flex-1">
                        {date.label}
                      </Label>
                      <Switch
                        id={`date-${date.value}`}
                        checked={settings.monitoredDates.includes(date.value)}
                        onCheckedChange={() => toggleMonitoredDate(date.value)}
                      />
                    </div>
                  ))}
                </div>
                {errors.monitoredDates && (
                  <p className="text-sm text-destructive">{errors.monitoredDates}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Les prix seront collectés pour les dates sélectionnées lors de chaque scan
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alert Thresholds Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Seuils d'alerte</CardTitle>
              </div>
              <CardDescription>
                Configurez les seuils pour déclencher des alertes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="alertThreshold">Seuil d'alerte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="alertThreshold"
                      type="number"
                      value={settings.alertThreshold}
                      onChange={(e) => setSettings({ ...settings, alertThreshold: e.target.value })}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Select
                      value={settings.alertThresholdType}
                      onValueChange={(value: "euro" | "percent") => setSettings({ ...settings, alertThresholdType: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="euro">€</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.alertThreshold && (
                    <p className="text-sm text-destructive">{errors.alertThreshold}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Une alerte sera déclenchée si la variation dépasse ce seuil
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="alertCooldown">Cooldown (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="alertCooldown"
                      type="number"
                      value={settings.alertCooldown}
                      onChange={(e) => setSettings({ ...settings, alertCooldown: e.target.value })}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {errors.alertCooldown && (
                    <p className="text-sm text-destructive">{errors.alertCooldown}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Délai minimum entre deux alertes pour le même concurrent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les paramètres
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
