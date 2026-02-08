"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Building2,
  Search,
  Plus,
  Eye,
  Star,
  MapPin,
  ExternalLink,
  Trash2,
  Edit,
  Globe
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";
import { z } from "zod";

// Schema de validation pour l'édition (on ne l'utilise plus pour la création)
const competitorSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  location: z.string().min(1, "La localisation est requise"),
  url: z.string().url("L'URL n'est pas valide").optional().or(z.literal("")),
  source: z.string().min(1, "La source est requise"),
  stars: z.number().min(1).max(5),
  isMonitored: z.boolean(),
  tags: z.string().optional(),
});

type Competitor = {
  id: number | string;
  name: string;
  location: string;
  address?: string;
  price: number;
  stars: number;
  photoUrl?: string;
  isMyHotel: boolean;
  isMonitored: boolean;
  url?: string;
  source?: string;
  tags?: string;
};

export default function CompetitorsPage() {
  const { isOpen } = useSidebar();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all-categories");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    url: "",
    source: "",
    stars: 4,
    photoUrl: "",
    isMonitored: true,
    tags: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractFailed, setExtractFailed] = useState(false);

  // Charger les concurrents depuis l'API
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/competitors");
        if (response.ok) {
          const data = await response.json();
          setCompetitors(data.map((c: any) => ({
            id: c.id || String(Date.now()),
            name: c.name,
            location: c.location ?? "",
            address: c.address ?? "",
            price: c.price || 0,
            stars: c.stars || 0,
            photoUrl: c.photoUrl,
            isMyHotel: false,
            isMonitored: c.isMonitored,
            url: c.url,
            source: c.source,
            tags: c.tags,
          })));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des concurrents:", error);
        toast.error("Erreur lors du chargement des concurrents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, []);

  // Filter competitors (exclude my hotel)
  const filteredCompetitors = competitors.filter((competitor) => {
    // Exclure complètement les hôtels marqués comme "mon hôtel"
    if (competitor.isMyHotel) {
      return false;
    }
    
    const matchesSearch = competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        competitor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "monitored" && competitor.isMonitored) ||
                         (filterStatus === "not-monitored" && !competitor.isMonitored);
    const matchesCategory = filterCategory === "all-categories" || 
                           String(competitor.stars) === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const totalCompetitors = competitors.length;
  const monitoredCount = competitors.filter(c => c.isMonitored).length;
  const avgStars = competitors.length > 0
    ? (competitors.reduce((sum, c) => sum + c.stars, 0) / competitors.length).toFixed(1)
    : "0";

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      url: "",
      source: "",
      stars: 4,
      photoUrl: "",
      isMonitored: true,
      tags: "",
    });
    setFormErrors({});
  };

  // Extract hotel info from URL
  const handleExtractInfo = async () => {
    if (!formData.url || !formData.url.includes("booking.com")) {
      toast.error("Veuillez entrer une URL Booking.com valide");
      return;
    }

    setIsExtracting(true);
    const loadingToast = toast.loading("Extraction en cours...", {
      duration: Infinity,
    });

    try {
      const response = await fetch("/api/competitors/extract-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'extraction");
      }

      const data = await response.json();

      // Remplir automatiquement les champs avec les infos extraites
      setFormData({
        ...formData,
        name: data.name || formData.name,
        location: data.location || formData.location,
        source: data.source || "booking.com",
        stars: data.stars || formData.stars,
        photoUrl: data.photoUrl || formData.photoUrl,
      });

      toast.dismiss(loadingToast);
      toast.success(`✅ Informations extraites avec succès !\n${data.name} - ${data.location} (${data.stars} étoiles)`);
    } catch (error) {
      console.error("Erreur lors de l'extraction:", error);
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error 
          ? `❌ ${error.message}` 
          : "Erreur lors de l'extraction des informations. Vérifiez que l'URL est correcte et que la page est accessible."
      );
    } finally {
      setIsExtracting(false);
    }
  };


  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (competitor: Competitor) => {
    setFormData({
      name: competitor.name,
      location: competitor.location,
      url: competitor.url || "",
      source: competitor.source || "",
      stars: competitor.stars,
      photoUrl: competitor.photoUrl || "",
      isMonitored: competitor.isMonitored,
      tags: competitor.tags || "",
    });
    setSelectedCompetitor(competitor);
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setIsDeleteDialogOpen(true);
  };

  // Validate form (utilisé uniquement pour l'édition)
  const validateForm = () => {
    try {
      competitorSchema.parse(formData);
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

  // Submit create (création simplifiée à partir de l'URL uniquement)
  const handleCreateSubmit = async () => {
    // On ne demande plus que l'URL côté UI
    if (!formData.url) {
      setFormErrors({ url: "L'URL est requise" });
      toast.error("Veuillez entrer l'URL Booking.com du concurrent");
      return;
    }

    if (!formData.url.includes("booking.com")) {
      setFormErrors({ url: "Seules les URLs Booking.com sont supportées" });
      toast.error("Veuillez entrer une URL Booking.com valide");
      return;
    }

    setFormErrors({});
    setExtractFailed(false);

    const loadingToast = toast.loading("Ajout du concurrent en cours...", {
      duration: Infinity,
    });
    setIsExtracting(true);

    try {
      // 1) Extraire les infos depuis l'URL (scraper Railway). Si échec (502/timeout), on ne crée pas pour éviter un 400.
      const extractResponse = await fetch("/api/competitors/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });

      if (!extractResponse.ok) {
        setIsExtracting(false);
        const errData = await extractResponse.json().catch(() => ({}));
        toast.dismiss(loadingToast);
        setExtractFailed(true);
        toast.error(
          errData.error ||
            "L'extraction a échoué (scraper indisponible ou timeout). Vous pouvez ajouter le concurrent quand même ci-dessous."
        );
        return;
      }
      setExtractFailed(false);

      const data = await extractResponse.json();
      setIsExtracting(false);
      const payload = {
        name: (data.name ?? "Concurrent Booking").trim() || "Concurrent Booking",
        location: (data.location ?? "").trim(),
        address: (data.address ?? "").trim(),
        url: formData.url.trim(),
        source: (data.source ?? "booking.com").trim(),
        stars: typeof data.stars === "number" ? data.stars : 4,
        photoUrl: data.photoUrl && typeof data.photoUrl === "string" ? data.photoUrl : "",
        isMonitored: true,
        tags: "",
      };

      // 2) Créer le concurrent dans la DB (uniquement si l'extraction a réussi)
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const newCompetitor = await response.json();

      // 3) Ajouter à la liste locale
      setCompetitors([
        ...competitors,
        {
          id: newCompetitor.id || String(Date.now()),
          name: newCompetitor.name,
          location: newCompetitor.location,
          address: newCompetitor.address,
          price: newCompetitor.price || 0,
          stars: newCompetitor.stars,
          photoUrl: newCompetitor.photoUrl,
          isMyHotel: false,
          isMonitored: newCompetitor.isMonitored,
          url: newCompetitor.url,
          source: newCompetitor.source,
          tags: newCompetitor.tags,
        },
      ]);

      setIsCreateDialogOpen(false);
      resetForm();
      setExtractFailed(false);
      toast.dismiss(loadingToast);
      toast.success("Concurrent ajouté avec succès");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      setIsExtracting(false);
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du concurrent"
      );
    }
  };

  // Ajout sans extraction (fallback quand le scraper renvoie 502)
  const handleAddWithoutExtraction = async () => {
    if (!formData.url?.trim()) {
      toast.error("Veuillez entrer l'URL Booking.com");
      return;
    }
    if (!formData.url.includes("booking.com")) {
      toast.error("Seules les URLs Booking.com sont supportées");
      return;
    }
    const loadingToast = toast.loading("Ajout du concurrent...", { duration: Infinity });
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name?.trim() || "Concurrent Booking",
          location: formData.location?.trim() || "",
          address: "",
          url: formData.url.trim(),
          source: "booking.com",
          stars: 4,
          photoUrl: "",
          isMonitored: true,
          tags: "",
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de la création");
      }
      const newCompetitor = await response.json();
      setCompetitors([
        ...competitors,
        {
          id: newCompetitor.id ?? String(Date.now()),
          name: newCompetitor.name,
          location: newCompetitor.location ?? "",
          price: newCompetitor.price ?? 0,
          stars: newCompetitor.stars ?? 4,
          photoUrl: newCompetitor.photoUrl,
          isMyHotel: false,
          isMonitored: newCompetitor.isMonitored ?? true,
          url: newCompetitor.url,
          source: newCompetitor.source ?? "booking.com",
          tags: newCompetitor.tags,
        },
      ]);
      setIsCreateDialogOpen(false);
      resetForm();
      setExtractFailed(false);
      toast.dismiss(loadingToast);
      toast.success("Concurrent ajouté (sans extraction des détails)");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    }
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedCompetitor) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    try {
      const response = await fetch(`/api/competitors/${selectedCompetitor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          url: formData.url,
          source: formData.source,
          stars: formData.stars,
          isMonitored: formData.isMonitored,
          tags: formData.tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const updatedCompetitor = await response.json();

      // Mettre à jour la liste locale (conserver photoUrl pour éviter qu'elle disparaisse)
      setCompetitors(competitors.map(c => 
        String(c.id) === String(selectedCompetitor.id)
          ? {
              id: updatedCompetitor.id || c.id,
              name: updatedCompetitor.name,
              location: updatedCompetitor.location ?? "",
              address: updatedCompetitor.address ?? "",
              price: updatedCompetitor.price ?? c.price,
              stars: updatedCompetitor.stars,
              photoUrl: updatedCompetitor.photoUrl ?? c.photoUrl,
              isMyHotel: false,
              isMonitored: updatedCompetitor.isMonitored,
              url: updatedCompetitor.url,
              source: updatedCompetitor.source,
              tags: updatedCompetitor.tags,
            }
          : c
      ));

      setIsEditDialogOpen(false);
      setSelectedCompetitor(null);
      resetForm();
      toast.success("Concurrent modifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de la modification du concurrent"
      );
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!selectedCompetitor) {
      toast.error("Aucun concurrent sélectionné");
      return;
    }

    try {
      const competitorId = selectedCompetitor.id;
      console.log("Suppression du concurrent:", competitorId);

      const response = await fetch(`/api/competitors/${competitorId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        // Si le concurrent n'existe pas (404), on le retire quand même de la liste locale
        if (response.status === 404) {
          console.log("Concurrent déjà supprimé, retrait de la liste locale");
          setCompetitors(competitors.filter(c => String(c.id) !== String(competitorId)));
          setIsDeleteDialogOpen(false);
          setSelectedCompetitor(null);
          toast.info("Ce concurrent a déjà été supprimé");
          return;
        }
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      const result = await response.json();
      console.log("Suppression réussie:", result);

      // Retirer de la liste locale
      setCompetitors(competitors.filter(c => String(c.id) !== String(competitorId)));
      setIsDeleteDialogOpen(false);
      setSelectedCompetitor(null);
      toast.success("Concurrent supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de la suppression du concurrent"
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Concurrents</h1>
              <p className="text-sm text-muted-foreground mt-1">Gérez votre set de concurrents surveillés</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un concurrent
            </Button>
          </div>
        </header>

        <section className="flex-1 p-6 space-y-6 overflow-auto">
          <>
          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Rechercher un hôtel..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="monitored">Surveillés</SelectItem>
                <SelectItem value="not-monitored">Non surveillés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">Toutes</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total concurrents</div>
                    <div className="text-2xl font-bold text-blue-600">{totalCompetitors}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Surveillés</div>
                    <div className="text-2xl font-bold text-green-600">{monitoredCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Catégorie moyenne</div>
                    <div className="text-2xl font-bold text-orange-600">{avgStars} <Star className="h-5 w-5 inline fill-orange-600 text-orange-600" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competitors Grid */}
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Chargement des concurrents...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitors.map((competitor) => (
                <Card key={competitor.id} className="relative">
                  <CardContent className="p-6">
                    {/* Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-2">
                        {competitor.isMonitored && (
                          <Badge className="bg-green-500 text-white">Surveillé</Badge>
                        )}
                        {competitor.source && (
                          <Badge variant="outline">{competitor.source}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Hotel Photo */}
                    <div className="flex justify-center mb-4">
                      {competitor.photoUrl ? (
                        <img 
                          src={competitor.photoUrl} 
                          alt={competitor.name}
                          className="h-64 w-full rounded-lg object-cover"
                          onError={(e) => {
                            // Fallback si l'image ne charge pas
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-64 w-full rounded-lg bg-muted flex items-center justify-center ${competitor.photoUrl ? 'hidden' : ''}`}>
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Hotel Name */}
                    <h3 className="text-lg font-semibold text-center mb-2">{competitor.name}</h3>

                    {/* Adresse complète ou localisation */}
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="text-center">{competitor.address || competitor.location}</span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < competitor.stars
                              ? "fill-yellow-500 text-yellow-500"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                      {competitor.stars > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({competitor.stars} étoiles)
                        </span>
                      )}
                    </div>

                    {/* Current Price */}
                    {competitor.price > 0 && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Tarif actuel</p>
                        <p className="text-2xl font-bold">{competitor.price}€</p>
                      </div>
                    )}

                    {/* Tags */}
                    {competitor.tags && (
                      <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {competitor.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                  {/* Action Icons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(competitor)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {competitor.url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(competitor.url, '_blank')}
                        title="Ouvrir l'URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {!competitor.isMyHotel && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(competitor)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {!isLoading && filteredCompetitors.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {competitors.length === 0 
                    ? "Aucun concurrent ajouté. Cliquez sur 'Ajouter un concurrent' pour commencer."
                    : "Aucun concurrent ne correspond à vos filtres"}
                </p>
              </CardContent>
            </Card>
          )}
          </>
        </section>
      </main>

      {/* Create Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) setExtractFailed(false);
          setIsCreateDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un concurrent</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel hôtel concurrent à surveiller en collant simplement son URL Booking.com
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-url">URL Booking.com *</Label>
              <Input
                id="create-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.booking.com/hotel/..."
                className="flex-1"
                disabled={isExtracting}
              />
              {formErrors.url && (
                <p className="text-sm text-destructive">{formErrors.url}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Entrez simplement l'URL de l'hôtel sur Booking.com, nous extrairons automatiquement les informations nécessaires.
              </p>
            </div>
            {extractFailed && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Le scraper est indisponible (502). Vous pouvez ajouter le concurrent avec l'URL saisie ; le nom par défaut sera « Concurrent Booking » (modifiable plus tard).
                </p>
                <Button variant="secondary" size="sm" onClick={handleAddWithoutExtraction}>
                  Ajouter sans extraction
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSubmit} disabled={isExtracting}>
              {isExtracting ? "Extraction..." : "Extraire et ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le concurrent</DialogTitle>
            <DialogDescription>
              Modifiez les informations de ce concurrent
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom de l'hôtel *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Localisation *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {formErrors.location && (
                <p className="text-sm text-destructive">{formErrors.location}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              {formErrors.url && (
                <p className="text-sm text-destructive">{formErrors.url}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-source">Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger id="edit-source">
                  <SelectValue placeholder="Sélectionner une source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Booking.com">Booking.com</SelectItem>
                  <SelectItem value="Expedia">Expedia</SelectItem>
                  <SelectItem value="Hotels.com">Hotels.com</SelectItem>
                  <SelectItem value="Agoda">Agoda</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.source && (
                <p className="text-sm text-destructive">{formErrors.source}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stars">Nombre d'étoiles *</Label>
              <Select
                value={formData.stars.toString()}
                onValueChange={(value) => setFormData({ ...formData, stars: parseInt(value) })}
              >
                <SelectTrigger id="edit-stars">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 étoile</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (optionnel)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-monitored">Surveillance active</Label>
                <p className="text-xs text-muted-foreground">
                  Activer la surveillance automatique de cet hôtel
                </p>
              </div>
              <Switch
                id="edit-monitored"
                checked={formData.isMonitored}
                onCheckedChange={(checked) => setFormData({ ...formData, isMonitored: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubmit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer le concurrent</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{selectedCompetitor?.name}</strong> ? Cette action est irréversible.
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
    </div>
  );
}
