"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bell,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  MapPin,
  Mail,
  Pause,
  Play,
  Trash2,
  Plus
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";
import { z } from "zod";

type Alert = {
  id: number;
  title: string;
  status: "active" | "paused";
  icon: typeof TrendingDown;
  description: string;
  hotels: string;
  emailEnabled: boolean;
  type?: string;
  condition?: string;
  value?: number;
};

const alertSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  condition: z.string().min(1, "La condition est requise"),
  value: z.string().min(1, "La valeur est requise").refine((val) => !isNaN(Number(val)), "La valeur doit être un nombre"),
  hotels: z.string().min(1, "Les hôtels sont requis"),
  email: z.boolean(),
});

const initialAlerts: Alert[] = [];

export default function AlertsPage() {
  const { isOpen } = useSidebar();
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    condition: "",
    value: "",
    hotels: "",
    email: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Stats
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(a => a.status === "active").length;
  const triggeredAlerts = 0; // Mock data

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      condition: "",
      value: "",
      hotels: "",
      email: false,
    });
    setFormErrors({});
  };

  // Validate form
  const validateForm = () => {
    try {
      alertSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  // Handle create
  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Handle create submit
  const handleCreateSubmit = () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    const typeMap: Record<string, typeof TrendingDown> = {
      drop: TrendingDown,
      rise: TrendingUp,
      variation: AlertTriangle,
      threshold: AlertTriangle,
    };

    const conditionMap: Record<string, string> = {
      below: "inférieur à",
      above: "supérieur à",
      variation: "Variation de",
    };

    const description = formData.condition === "variation" 
      ? `Variation de prix de ${formData.value}%`
      : `Tarif ${conditionMap[formData.condition] || ""} ${formData.value}€`;

    const newAlert: Alert = {
      id: Math.max(...alerts.map(a => a.id), 0) + 1,
      title: formData.name,
      status: "active",
      icon: typeMap[formData.type] || TrendingDown,
      description,
      hotels: formData.hotels === "all" ? "Tous les hôtels" : "Hôtels spécifiques",
      emailEnabled: formData.email,
      type: formData.type,
      condition: formData.condition,
      value: Number(formData.value),
    };

    setAlerts([...alerts, newAlert]);
    setIsDialogOpen(false);
    resetForm();
    toast.success("Alerte créée avec succès");
  };

  // Handle toggle status
  const handleToggleStatus = (alert: Alert) => {
    setAlerts(alerts.map(a => 
      a.id === alert.id
        ? { ...a, status: a.status === "active" ? "paused" : "active" }
        : a
    ));
    toast.success(`Alerte ${alert.status === "active" ? "mise en pause" : "activée"}`);
  };

  // Handle delete click
  const handleDeleteClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (!selectedAlert) return;

    setAlerts(alerts.filter(a => a.id !== selectedAlert.id));
    setIsDeleteDialogOpen(false);
    setSelectedAlert(null);
    toast.success("Alerte supprimée avec succès");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Alertes</h1>
              <p className="text-sm text-muted-foreground mt-1">Configurez vos alertes de surveillance tarifaire</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une alerte
            </Button>
          </div>
        </header>

        {/* Create Alert Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une alerte</DialogTitle>
              <DialogDescription>
                Configurez une nouvelle alerte de surveillance tarifaire pour être notifié des changements de prix.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de l'alerte *</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Baisse significative"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type d'alerte *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drop">Baisse significative</SelectItem>
                    <SelectItem value="rise">Hausse significative</SelectItem>
                    <SelectItem value="variation">Variation forte</SelectItem>
                    <SelectItem value="threshold">Seuil de prix</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-sm text-destructive">{formErrors.type}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Sélectionner une condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below">Tarif inférieur à</SelectItem>
                    <SelectItem value="above">Tarif supérieur à</SelectItem>
                    <SelectItem value="variation">Variation de</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.condition && (
                  <p className="text-sm text-destructive">{formErrors.condition}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valeur *</Label>
                <Input 
                  id="value" 
                  type="number" 
                  placeholder="Ex: 100" 
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
                {formErrors.value && (
                  <p className="text-sm text-destructive">{formErrors.value}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hotels">Hôtels concernés *</Label>
                <Select
                  value={formData.hotels}
                  onValueChange={(value) => setFormData({ ...formData, hotels: value })}
                >
                  <SelectTrigger id="hotels">
                    <SelectValue placeholder="Sélectionner les hôtels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les hôtels</SelectItem>
                    <SelectItem value="specific">Hôtels spécifiques</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.hotels && (
                  <p className="text-sm text-destructive">{formErrors.hotels}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Notifications par email</Label>
                  <p className="text-xs text-muted-foreground">
                    Recevez un email lorsque l'alerte est déclenchée
                  </p>
                </div>
                <Switch 
                  id="email"
                  checked={formData.email}
                  onCheckedChange={(checked) => setFormData({ ...formData, email: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateSubmit}>
                Créer l'alerte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Supprimer l'alerte</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer l'alerte <strong>{selectedAlert?.title}</strong> ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total alertes</div>
                    <div className="text-2xl font-bold text-blue-600">{totalAlerts}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Actives</div>
                    <div className="text-2xl font-bold text-green-600">{activeAlerts}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Déclenchées</div>
                    <div className="text-2xl font-bold text-orange-600">{triggeredAlerts}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {alerts.map((alert) => {
              const IconComponent = alert.icon;
              return (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <IconComponent className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{alert.title}</h3>
                            <Badge 
                              className={
                                alert.status === "active" 
                                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                                  : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
                              }
                            >
                              {alert.status === "active" ? "Active" : "En pause"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>{alert.hotels}</span>
                            </div>
                            {alert.emailEnabled && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                <span>Email activé</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === "active" ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(alert)}
                            title="Mettre en pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(alert)}
                            title="Activer"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(alert)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {alerts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune alerte configurée</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
