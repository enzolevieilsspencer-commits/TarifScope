"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  BarChart3,
  ArrowDown,
  Star,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Eye,
  ExternalLink,
  Calendar,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";

const initialPriceEvolutionData = [
  { date: "17 déc.", monHotel: 140, moyenneConcurrents: 125 },
  { date: "18 déc.", monHotel: 155, moyenneConcurrents: 130 },
  { date: "19 déc.", monHotel: 150, moyenneConcurrents: 135 },
  { date: "20 déc.", monHotel: 165, moyenneConcurrents: 140 },
  { date: "21 déc.", monHotel: 160, moyenneConcurrents: 145 },
  { date: "22 déc.", monHotel: 175, moyenneConcurrents: 150 },
  { date: "23 déc.", monHotel: 170, moyenneConcurrents: 148 },
  { date: "24 déc.", monHotel: 180, moyenneConcurrents: 152 },
  { date: "25 déc.", monHotel: 165, moyenneConcurrents: 138 },
  { date: "26 déc.", monHotel: 155, moyenneConcurrents: 132 },
  { date: "27 déc.", monHotel: 170, moyenneConcurrents: 145 },
  { date: "28 déc.", monHotel: 175, moyenneConcurrents: 150 },
  { date: "29 déc.", monHotel: 160, moyenneConcurrents: 142 },
  { date: "30 déc.", monHotel: 185, moyenneConcurrents: 155 },
  { date: "31 déc.", monHotel: 180, moyenneConcurrents: 148 },
  { date: "1 janv.", monHotel: 170, moyenneConcurrents: 140 },
  { date: "2 janv.", monHotel: 165, moyenneConcurrents: 135 },
  { date: "3 janv.", monHotel: 175, moyenneConcurrents: 145 },
  { date: "4 janv.", monHotel: 160, moyenneConcurrents: 130 },
  { date: "5 janv.", monHotel: 155, moyenneConcurrents: 125 },
  { date: "6 janv.", monHotel: 170, moyenneConcurrents: 140 },
  { date: "7 janv.", monHotel: 165, moyenneConcurrents: 138 },
  { date: "8 janv.", monHotel: 180, moyenneConcurrents: 150 },
  { date: "9 janv.", monHotel: 175, moyenneConcurrents: 145 },
  { date: "10 janv.", monHotel: 170, moyenneConcurrents: 142 },
  { date: "11 janv.", monHotel: 165, moyenneConcurrents: 138 },
  { date: "12 janv.", monHotel: 180, moyenneConcurrents: 152 },
  { date: "13 janv.", monHotel: 175, moyenneConcurrents: 148 },
  { date: "14 janv.", monHotel: 185, moyenneConcurrents: 155 },
];

const dashboardColors: Record<string, { color: string; name: string }> = {
  monHotelY: { color: "#3b82f6", name: "Mon hôtel" },
  moyenneConcurrentsY: { color: "#22c55e", name: "Moyenne concurrents" },
};

const DashboardTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const order = ['monHotelY', 'moyenneConcurrentsY'];
    const sortedPayload = order.map(key => 
      payload.find((entry: any) => entry.dataKey === key)
    ).filter(Boolean);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 min-w-[220px]">
        <div className="font-bold text-gray-900 mb-3">{label}</div>
        <div className="space-y-2">
          {sortedPayload.map((entry: any, index: number) => {
            const hotelInfo = dashboardColors[entry.dataKey];
            if (!hotelInfo) return null;
            const isIndisponible = entry.dataKey === 'monHotelY'
              ? (entry.payload?.monHotelIndisponible === true)
              : (entry.payload?.moyenneConcurrentsIndisponible === true);
            const displayText = isIndisponible
              ? "Indisponible"
              : (entry.value != null && entry.value !== "" && Number(entry.value) > 0 ? `${Number(entry.value)} €` : "Indisponible");
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: hotelInfo.color }}
                />
                <span className="text-sm text-gray-700">
                  {hotelInfo.name}: <span className="font-bold text-gray-900">{displayText}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

type Hotel = {
  id: string | number;
  name: string;
  stars: number;
  minOTA: number;
  booking: number;
  expedia: number;
  setConcurrent: number;
  delta: number;
  lastUpdate: string;
  isPositive: boolean;
  isMyHotel?: boolean;
};

const initialHotels: Hotel[] = [
  { id: 1, name: "Le Grand Hotel", stars: 4, minOTA: 129, booking: 129, expedia: 135, setConcurrent: 133, delta: 4, lastUpdate: "2 h", isPositive: true },
  { id: 2, name: "Hôtel Rivage", stars: 4, minOTA: 139, booking: 139, expedia: 141, setConcurrent: 142, delta: 3, lastUpdate: "4 h", isPositive: true },
  { id: 3, name: "Hôtel Lumière", stars: 4, minOTA: 145, booking: 145, expedia: 149, setConcurrent: 147, delta: 2, lastUpdate: "il y a 1h", isPositive: false },
  { id: 4, name: "City Stay Hotel", stars: 3, minOTA: 119, booking: 119, expedia: 125, setConcurrent: 120, delta: 1, lastUpdate: "3 h", isPositive: false },
  { id: 5, name: "Horizon Palace", stars: 4, minOTA: 145, booking: 145, expedia: 151, setConcurrent: 148, delta: 2, lastUpdate: "5 h", isPositive: false },
];

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const { isOpen } = useSidebar();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [priceEvolutionData, setPriceEvolutionData] = useState<typeof initialPriceEvolutionData>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30j");
  const [statusFilter, setStatusFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all-season");
  const [currentPage, setCurrentPage] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carte calendrier : date choisie + prix par concurrent pour cette date
  const [cardSelectedDate, setCardSelectedDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [cardPricesByDate, setCardPricesByDate] = useState<{
    dateLabel: string;
    competitors: { name: string; price: number; isMyHotel: boolean }[];
  } | null>(null);
  const [loadingCardDate, setLoadingCardDate] = useState(false);
  const [availableDatesForCard, setAvailableDatesForCard] = useState<string[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // KPIs depuis l'API
  const [kpis, setKpis] = useState({
    monitoredHotels: 0,
    activeAlerts: 0,
    avgPrice: 0,
    gap: 0,
    minPrice: 0,
  });

  // Charger la liste des dates qui ont des prix (J+7, J+14, J+30 des scans)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard/dates")
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted || !data.dates?.length) return;
        setAvailableDatesForCard(data.dates);
        // Si la date actuellement choisie n'a pas de données, présélectionner la dernière date disponible
        setCardSelectedDate((prev) => {
          if (data.dates.includes(prev)) return prev;
          return data.dates[data.dates.length - 1];
        });
      });
    return () => { isMounted = false; };
  }, []);

  // Charger les prix par concurrent pour la date choisie (carte calendrier)
  useEffect(() => {
    let isMounted = true;
    setLoadingCardDate(true);
    setCardPricesByDate(null);
    fetch(`/api/dashboard/by-date?date=${cardSelectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.error) {
          setCardPricesByDate(null);
          return;
        }
        setCardPricesByDate({
          dateLabel: data.dateLabel || cardSelectedDate,
          competitors: data.competitors || [],
        });
      })
      .finally(() => {
        if (isMounted) setLoadingCardDate(false);
      });
    return () => { isMounted = false; };
  }, [cardSelectedDate]);

  // Charger les données depuis l'API
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        const response = await fetch("/api/dashboard/data");
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          
          if (!isMounted) return;
          
          // Mettre à jour les KPIs
          if (data.kpis) {
            setKpis({
              monitoredHotels: data.kpis.totalCompetitors || 0,
              activeAlerts: data.kpis.activeAlerts || 0,
              avgPrice: data.kpis.avgCompetitorPrice || 0,
              gap: data.kpis.priceGap || 0,
              minPrice: data.kpis.minCompetitorPrice || 0,
            });
          }
          
          // Mettre à jour le tableau des hôtels
          if (data.hotelsTable) {
            // Trier : mon hôtel en premier, puis les autres
            const sorted = [...data.hotelsTable].sort((a: any, b: any) => {
              if (a.isMyHotel && !b.isMyHotel) return -1;
              if (!a.isMyHotel && b.isMyHotel) return 1;
              return 0;
            });
            
            setHotels(sorted.map((h: any) => ({
              id: h.id,
              name: h.name,
              stars: h.stars || 0,
              minOTA: h.minOTA || 0,
              booking: h.booking || 0,
              expedia: h.expedia || 0,
              setConcurrent: h.setConcurrent || 0,
              delta: h.delta || 0,
              lastUpdate: h.lastUpdate || "Jamais",
              isPositive: h.isPositive !== undefined ? h.isPositive : h.delta >= 0,
              isMyHotel: h.isMyHotel || false,
            })));
          }
          
          // Mettre à jour le graphique avec les prix enregistrés (tri par date pour affichage correct)
          if (data.chartData && data.chartData.length > 0) {
            const sorted = [...data.chartData].sort(
              (a: { dateISO?: string }, b: { dateISO?: string }) =>
                (a.dateISO || "").localeCompare(b.dateISO || "")
            );
            setPriceEvolutionData(sorted);
          } else {
            setPriceEvolutionData([]);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle scan - connecté à l'API
  const handleScan = async () => {
    setIsScanning(true);
    toast.info("Lancement du scan en cours...");
    
    try {
      const response = await fetch("/api/scans/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du scan");
      }

      const result = await response.json();
      
      toast.success(
        `Scan terminé ! ${result.snapshotsCreated || 0} snapshot(s) créé(s)`
      );
      
      // Recharger les données après le scan
      const dashboardResponse = await fetch("/api/dashboard/data");
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.kpis) {
          setKpis({
            monitoredHotels: dashboardData.kpis.totalCompetitors || 0,
            activeAlerts: dashboardData.kpis.activeAlerts || 0,
            avgPrice: dashboardData.kpis.avgCompetitorPrice || 0,
            gap: dashboardData.kpis.priceGap || 0,
            minPrice: dashboardData.kpis.minCompetitorPrice || 0,
          });
        }
        if (dashboardData.hotelsTable) {
          // Trier : mon hôtel en premier, puis les autres
          const sorted = [...dashboardData.hotelsTable].sort((a: any, b: any) => {
            if (a.isMyHotel && !b.isMyHotel) return -1;
            if (!a.isMyHotel && b.isMyHotel) return 1;
            return 0;
          });
          
          setHotels(sorted.map((h: any) => ({
            id: h.id,
            name: h.name,
            stars: h.stars || 0,
            minOTA: h.minOTA || 0,
            booking: h.booking || 0,
            expedia: h.expedia || 0,
            setConcurrent: h.setConcurrent || 0,
            delta: h.delta || 0,
            lastUpdate: h.lastUpdate || "Jamais",
            isPositive: h.isPositive !== undefined ? h.isPositive : h.delta >= 0,
            isMyHotel: h.isMyHotel || false,
          })));
        }
        if (dashboardData.chartData && dashboardData.chartData.length > 0) {
          const sorted = [...dashboardData.chartData].sort(
            (a: { dateISO?: string }, b: { dateISO?: string }) =>
              (a.dateISO || "").localeCompare(b.dateISO || "")
          );
          setPriceEvolutionData(sorted);
        }
        // Rafraîchir la carte calendrier avec les nouveaux prix scrapés
        const byDateRes = await fetch(`/api/dashboard/by-date?date=${cardSelectedDate}`);
        if (byDateRes.ok) {
          const byDateData = await byDateRes.json();
          setCardPricesByDate({
            dateLabel: byDateData.dateLabel || cardSelectedDate,
            competitors: byDateData.competitors || [],
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du scan:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors du scan"
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Filter hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [hotels, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / ITEMS_PER_PAGE);
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredHotels.slice(start, end);
  }, [filteredHotels, currentPage]);

  // Filtre : toujours afficher les X prochains jours (une entrée par date). Pas de prix = null → courbe continue + "Indisponible" dans le tooltip
  const filteredPriceEvolutionData = useMemo(() => {
    const count = periodFilter === "7j" ? 7 : periodFilter === "14j" ? 14 : 30;
    const now = new Date();
    const utcY = now.getUTCFullYear(), utcM = now.getUTCMonth(), utcD = now.getUTCDate();
    const byDateISO: Record<string, { monHotel?: number; moyenneConcurrents?: number }> = {};
    for (const d of priceEvolutionData as { dateISO?: string; monHotel?: number; moyenneConcurrents?: number }[]) {
      const key = d.dateISO || "";
      if (!key) continue;
      byDateISO[key] = {
        monHotel: d.monHotel != null && d.monHotel > 0 ? d.monHotel : undefined,
        moyenneConcurrents: d.moyenneConcurrents != null && d.moyenneConcurrents > 0 ? d.moyenneConcurrents : undefined,
      };
    }
    const result: {
      date: string;
      dateISO: string;
      monHotel: number | null;
      moyenneConcurrents: number | null;
      monHotelY: number;
      moyenneConcurrentsY: number;
      monHotelIndisponible: boolean;
      moyenneConcurrentsIndisponible: boolean;
    }[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.UTC(utcY, utcM, utcD + i));
      const dateISO = d.toISOString().split("T")[0];
      const row = byDateISO[dateISO];
      const monHotel = row?.monHotel != null ? row.monHotel : null;
      const moyenneConcurrents = row?.moyenneConcurrents != null ? row.moyenneConcurrents : null;
      // Pour ne pas couper la courbe : si pas de prix, on continue au niveau de l'autre série
      const monHotelY = monHotel ?? moyenneConcurrents ?? 0;
      const moyenneConcurrentsY = moyenneConcurrents ?? monHotel ?? 0;
      result.push({
        date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }),
        dateISO,
        monHotel: monHotel ?? null,
        moyenneConcurrents: moyenneConcurrents ?? null,
        monHotelY,
        moyenneConcurrentsY,
        monHotelIndisponible: monHotel == null,
        moyenneConcurrentsIndisponible: moyenneConcurrents == null,
      });
    }
    return result;
  }, [priceEvolutionData, periodFilter]);

  // Grille du mois pour le calendrier modal (lundi = premier jour)
  const calendarGrid = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = (first.getDay() + 6) % 7; // 0 = lundi
    const leading = firstWeekday;
    const cells: (number | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const total = 42;
    while (cells.length < total) cells.push(null);
    return { cells, year: y, month: m, daysInMonth };
  }, [calendarMonth]);

  // Domaine Y dynamique pour le graphique (éviter de couper les prix scrapés)
  const chartDomainY = useMemo(() => {
    if (filteredPriceEvolutionData.length === 0) return [0, 200];
    const values = filteredPriceEvolutionData.flatMap((d) => [
      d.monHotelY,
      d.moyenneConcurrentsY,
    ]).filter((v) => typeof v === "number" && v > 0);
    if (values.length === 0) return [0, 200];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(20, (max - min) * 0.1);
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [filteredPriceEvolutionData]);

  // Handle export CSV
  const handleExportCSV = () => {
    const headers = ["Hôtel", "Min OTA", "Booking", "Expedia", "Set concurrent", "Delta", "Dernière maj"];
    const rows = hotels.map(hotel => [
      hotel.name,
      hotel.minOTA > 0 ? hotel.minOTA.toString() : "Indisponible",
      hotel.booking > 0 ? hotel.booking.toString() : "Indisponible",
      hotel.expedia > 0 ? hotel.expedia.toString() : "Indisponible",
      hotel.setConcurrent > 0 ? hotel.setConcurrent.toString() : "Indisponible",
      hotel.setConcurrent > 0 ? hotel.delta.toString() : "—",
      hotel.lastUpdate
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export CSV réussi !");
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Stats depuis l'API (déjà dans le state kpis)
  const { monitoredHotels, activeAlerts, avgPrice, gap, minPrice } = kpis;

  // Prix pour le jour J (aujourd'hui) — premier point du graphique
  const prixMonHotelJourJ = filteredPriceEvolutionData[0]?.monHotel != null && filteredPriceEvolutionData[0].monHotel > 0
    ? filteredPriceEvolutionData[0].monHotel
    : null;
  const prixMoyenneConcurrentsJourJ = filteredPriceEvolutionData[0]?.moyenneConcurrents != null && filteredPriceEvolutionData[0].moyenneConcurrents > 0
    ? filteredPriceEvolutionData[0].moyenneConcurrents
    : null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre veille tarifaire</p>
            <div className="mt-3">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="30 prochains jours" />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false} position="popper">
                  <SelectItem value="7j">7 prochains jours</SelectItem>
                  <SelectItem value="14j">14 prochains jours</SelectItem>
                  <SelectItem value="30j">30 prochains jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <section className="flex-1 p-6 space-y-6 overflow-auto">
          <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wide">HÔTELS SURVEILLÉS</CardDescription>
                      <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="text-3xl font-bold">{monitoredHotels}</div>
                      <div className="mt-2 text-sm text-muted-foreground">Concurrents actifs</div>
                    </div>
                  </CardContent>
                </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide">ALERTES ACTIVES</CardDescription>
                  <Bell className="h-8 w-8 text-primary flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-3xl font-bold">{activeAlerts}</div>
                  <div className="mt-2 text-sm text-muted-foreground">En surveillance</div>
                </div>
              </CardContent>
            </Card>

            {/* Carte type calendrier : date choisie + prix de chaque concurrent */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-br-lg">
                {cardPricesByDate?.dateLabel ?? new Date(cardSelectedDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="absolute top-0 right-0 pt-5 pr-3 flex items-center justify-center">
                <button
                  type="button"
                  className="h-[30px] w-[30px] flex items-center justify-center text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Ouvrir le calendrier"
                  aria-label="Ouvrir le calendrier"
                  onClick={() => {
                  setCalendarMonth(new Date(cardSelectedDate + "T12:00:00"));
                  setIsCalendarModalOpen(true);
                }}
                >
                  <Calendar className="h-[30px] w-[30px] flex-shrink-0" />
                </button>
              </div>
              <CardContent className="pt-12 pb-3 px-3">
                {loadingCardDate ? (
                  <div className="space-y-1.5 max-h-[140px] flex items-center justify-center py-6 text-sm text-muted-foreground">
                    Chargement...
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {cardPricesByDate && cardPricesByDate.competitors.length > 0 ? (
                      cardPricesByDate.competitors.map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-sm gap-2 py-0.5">
                          <span className="truncate font-medium" title={c.name}>
                            {c.isMyHotel ? (
                              <span className="text-primary">{c.name}</span>
                            ) : (
                              c.name
                            )}
                          </span>
                          <span className="font-semibold text-primary shrink-0">
                            {c.price > 0 ? `${Math.round(c.price)} €` : "—"}
                          </span>
                        </div>
                      ))
                    ) : cardPricesByDate?.competitors.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Aucun prix pour cette date. Les prix sont enregistrés pour les dates J+7, J+14, J+30 (lancez un scan).
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground py-2">
                        {availableDatesForCard.length === 0
                          ? "Lancez un scan pour enregistrer des prix (J+7, J+14, J+30)."
                          : "Aucune donnée."}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal calendrier : grand calendrier + prix par jour */}
            <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
              <DialogContent className="w-[98vw] max-w-none max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Calendrier des tarifs</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
                      aria-label="Mois précédent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold capitalize">
                      {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                      <div key={d} className="text-xs font-medium text-muted-foreground py-1">
                        {d}
                      </div>
                    ))}
                    {calendarGrid.cells.map((day, i) => {
                      if (day === null) return <div key={i} className="p-2 min-h-[44px]" />;
                      const dateStr = `${calendarGrid.year}-${String(calendarGrid.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isSelected = cardSelectedDate === dateStr;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCardSelectedDate(dateStr);
                          }}
                          className={`p-2 min-h-[44px] rounded-md text-sm font-medium transition-colors hover:bg-primary/10 ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted/50 hover:bg-muted"}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold mb-2">
                      Prix pour le {cardPricesByDate?.dateLabel ?? new Date(cardSelectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </h4>
                    {loadingCardDate ? (
                      <p className="text-sm text-muted-foreground py-4">Chargement...</p>
                    ) : cardPricesByDate && cardPricesByDate.competitors.length > 0 ? (
                      <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                        {cardPricesByDate.competitors.map((c) => (
                          <li key={c.name} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                            <span className={c.isMyHotel ? "font-semibold text-primary" : ""}>{c.name}</span>
                            <span className="font-semibold text-primary">{c.price > 0 ? `${Math.round(c.price)} €` : "—"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        Aucun prix pour cette date. Lancez un scan pour enregistrer des prix.
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide">ÉCART VS CONCURRENTS</CardDescription>
                  <span className="h-8 w-8 text-primary flex-shrink-0 flex items-center justify-center text-3xl font-medium leading-none">€</span>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-3xl font-bold">{gap > 0 ? '+' : ''}{gap} €</div>
                  <div className="mt-2 text-sm text-muted-foreground">Différence moyenne</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Quick Overview Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="relative">
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsChartModalOpen(true)}
                    title="Plein écran"
                    disabled={filteredPriceEvolutionData.length === 0}
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
                <CardTitle>Évolution des tarifs</CardTitle>
                <p className="text-sm text-muted-foreground font-normal pr-10">
                  Données issues des scans (mon hôtel vs moyenne des concurrents).
                </p>
              </CardHeader>
              <CardContent>
                {filteredPriceEvolutionData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Aucun prix enregistré.</p>
                    <p className="text-xs mt-1">Lancez un scan pour remplir le graphique et le calendrier.</p>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={filteredPriceEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMonHotel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMoyenneConcurrents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      interval={2}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      domain={chartDomainY as [number, number]}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <Tooltip content={<DashboardTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="monHotelY" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMonHotel)"
                      name="Mon hôtel"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="moyenneConcurrentsY" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMoyenneConcurrents)"
                      name="Moyenne concurrents"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Modal plein écran du graphique dashboard */}
            <Dialog open={isChartModalOpen} onOpenChange={setIsChartModalOpen}>
              <DialogContent fullScreen className="flex flex-col p-4">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Évolution des tarifs — plein écran</DialogTitle>
                  <div className="mt-3">
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="30 prochains jours" />
                      </SelectTrigger>
                      <SelectContent side="bottom" avoidCollisions={false} position="popper">
                        <SelectItem value="7j">7 prochains jours</SelectItem>
                        <SelectItem value="14j">14 prochains jours</SelectItem>
                        <SelectItem value="30j">30 prochains jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogHeader>
                <div className="flex-1 min-h-0 pt-2">
                  {filteredPriceEvolutionData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredPriceEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="modalColorMonHotel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="modalColorMoyenneConcurrents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <YAxis stroke="#6b7280" domain={chartDomainY as [number, number]} tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <Tooltip content={<DashboardTooltip />} />
                        <Area type="monotone" dataKey="monHotelY" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#modalColorMonHotel)" name="Mon hôtel" />
                        <Area type="monotone" dataKey="moyenneConcurrentsY" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#modalColorMoyenneConcurrents)" name="Moyenne concurrents" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Prix de mon hôtel</div>
                  <div className="text-3xl font-bold text-black">
                    {prixMonHotelJourJ != null ? `${Math.round(prixMonHotelJourJ)}€` : 'N/A'}
                  </div>
                </div>
                <div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Prix moyen concurrents</div>
                  <div className="text-3xl font-bold text-black">{prixMoyenneConcurrentsJourJ != null ? `${Math.round(prixMoyenneConcurrentsJourJ)}€` : 'N/A'}</div>
                </div>
                <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 border border-red-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Écart</div>
                  <div className="text-3xl font-bold text-black">
                    {prixMonHotelJourJ != null && prixMoyenneConcurrentsJourJ != null
                      ? (prixMonHotelJourJ - prixMoyenneConcurrentsJourJ > 0 ? '+' : '') + Math.round(prixMonHotelJourJ - prixMoyenneConcurrentsJourJ) + '€'
                      : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotels Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Concurrents surveillés</CardTitle>
              <CardDescription>
                {isLoading ? "Chargement..." : `${filteredHotels.length} concurrent${filteredHotels.length > 1 ? 's' : ''} surveillé${filteredHotels.length > 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Chargement des données...
                </div>
              ) : filteredHotels.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun concurrent surveillé. Ajoutez des concurrents dans l'onglet "Concurrents".
                  </p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base py-4">Hôtel</TableHead>
                    <TableHead className="text-right text-base py-4">Min OTA</TableHead>
                    <TableHead className="text-right text-base py-4">
                      <div className="flex items-center justify-end gap-1">
                        Booking
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-base py-4">
                      <div className="flex items-center justify-end gap-1">
                        hotel.com
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-base py-4">Set concurrent</TableHead>
                    <TableHead className="text-right text-base py-4">
                      <div className="flex items-center justify-end gap-1">
                        Delta vs set
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-base py-4">Dernière maj</TableHead>
                    <TableHead className="w-12 py-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHotels.map((hotel) => (
                    <TableRow key={hotel.id}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium text-base">{hotel.name}</span>
                          {hotel.isMyHotel && (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs">
                              Mon hôtel
                            </Badge>
                          )}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.minOTA > 0 ? `${hotel.minOTA}€` : <span className="text-muted-foreground">Indisponible</span>}</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.booking > 0 ? `${hotel.booking}€` : <span className="text-muted-foreground">Indisponible</span>}</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.expedia > 0 ? `${hotel.expedia}€` : <span className="text-muted-foreground">Indisponible</span>}</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.setConcurrent > 0 ? `${hotel.setConcurrent}€` : <span className="text-muted-foreground">Indisponible</span>}</TableCell>
                      <TableCell className="text-right py-4">
                        {hotel.setConcurrent > 0 ? (
                          <Badge 
                            className={hotel.isPositive 
                              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm px-2 py-1" 
                              : "bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm px-2 py-1"
                            }
                          >
                            {hotel.delta > 0 ? '+' : ''}{hotel.delta}€
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-base text-muted-foreground py-4">{hotel.lastUpdate}</TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info(`Affichage des détails de ${hotel.name}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Ouverture de ${hotel.name} dans un nouvel onglet`)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ouvrir dans Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Données de ${hotel.name} exportées`)}>
                              <Download className="h-4 w-4 mr-2" />
                              Exporter les données
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
              {!isLoading && filteredHotels.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-base text-muted-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHotels.length)} sur {filteredHotels.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
          </>

        </section>
      </main>
    </div>
  );
}
