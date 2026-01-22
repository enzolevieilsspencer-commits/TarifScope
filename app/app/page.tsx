"use client";

import { useState, useMemo } from "react";
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
  ExternalLink
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

const dashboardColors = {
  monHotel: { color: "#3b82f6", name: "Mon hôtel" },
  moyenneConcurrents: { color: "#22c55e", name: "Moyenne concurrents" },
};

const DashboardTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const order = ['monHotel', 'moyenneConcurrents'];
    const sortedPayload = order.map(key => 
      payload.find((entry: any) => entry.dataKey === key)
    ).filter(Boolean);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 min-w-[220px]">
        <div className="font-bold text-gray-900 mb-3">{label}</div>
        <div className="space-y-2">
          {sortedPayload.map((entry: any, index: number) => {
            const hotelKey = entry.dataKey as keyof typeof dashboardColors;
            const hotelInfo = dashboardColors[hotelKey];
            if (!hotelInfo) return null;
            
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: hotelInfo.color }}
                />
                <span className="text-sm text-gray-700">
                  {hotelInfo.name}: <span className="font-bold text-gray-900">{entry.value}€</span>
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
  id: number;
  name: string;
  stars: number;
  minOTA: number;
  booking: number;
  expedia: number;
  setConcurrent: number;
  delta: number;
  lastUpdate: string;
  isPositive: boolean;
};

const initialHotels: Hotel[] = [
  { id: 1, name: "Le Grand Hotel", stars: 4, minOTA: 129, booking: 129, expedia: 135, setConcurrent: 133, delta: 4, lastUpdate: "2 h", isPositive: true },
  { id: 2, name: "Hôtel Rivage", stars: 4, minOTA: 139, booking: 139, expedia: 141, setConcurrent: 142, delta: 3, lastUpdate: "4 h", isPositive: true },
  { id: 3, name: "Hôtel Lumière", stars: 4, minOTA: 145, booking: 145, expedia: 149, setConcurrent: 147, delta: 2, lastUpdate: "il y a 1h", isPositive: false },
  { id: 4, name: "City Stay Hotel", stars: 3, minOTA: 119, booking: 119, expedia: 125, setConcurrent: 120, delta: 1, lastUpdate: "3 h", isPositive: false },
  { id: 5, name: "Horizon Palace", stars: 4, minOTA: 145, booking: 145, expedia: 151, setConcurrent: 148, delta: 2, lastUpdate: "5 h", isPositive: false },
];

const ITEMS_PER_PAGE = 5;

export default function Dashboard() {
  const { isOpen } = useSidebar();
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
  const [priceEvolutionData, setPriceEvolutionData] = useState(initialPriceEvolutionData);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("30j");
  const [statusFilter, setStatusFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all-season");
  const [currentPage, setCurrentPage] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  // Handle scan (mock)
  const handleScan = () => {
    setIsScanning(true);
    toast.info("Lancement du scan en cours...");
    
    // Simuler un scan
    setTimeout(() => {
      setIsScanning(false);
      toast.success("Scan terminé ! 5 succès, 0 échecs");
    }, 2000);
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

  // Filter price data based on period
  const filteredPriceEvolutionData = useMemo(() => {
    if (periodFilter === "7j") {
      return priceEvolutionData.slice(-7);
    } else if (periodFilter === "90j") {
      return priceEvolutionData;
    }
    return priceEvolutionData.slice(-30);
  }, [priceEvolutionData, periodFilter]);

  // Handle export CSV
  const handleExportCSV = () => {
    const headers = ["Hôtel", "Min OTA", "Booking", "Expedia", "Set concurrent", "Delta", "Dernière maj"];
    const rows = hotels.map(hotel => [
      hotel.name,
      hotel.minOTA.toString(),
      hotel.booking.toString(),
      hotel.expedia.toString(),
      hotel.setConcurrent.toString(),
      hotel.delta.toString(),
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

  // Stats (mock data)
  const monitoredHotels = 5;
  const activeAlerts = 2;
  const avgPrice = 140;
  const gap = 8;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre veille tarifaire</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleScan}
                disabled={isScanning}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? "Scan en cours..." : "Lancer un scan"}
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="30 derniers jours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7j">7 derniers jours</SelectItem>
                <SelectItem value="30j">30 derniers jours</SelectItem>
                <SelectItem value="90j">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="monitored">Surveillés</SelectItem>
                <SelectItem value="not-monitored">Non surveillés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Toutes saisons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-season">Toutes saisons</SelectItem>
                <SelectItem value="summer">Été</SelectItem>
                <SelectItem value="winter">Hiver</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Rechercher un hôtel..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
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

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide">TARIF MOYEN CONCURRENTS</CardDescription>
                  <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-3xl font-bold">{avgPrice > 0 ? `${avgPrice} €` : 'N/A'}</div>
                  <div className="mt-2 text-sm text-muted-foreground">Prix moyen surveillé</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide">ÉCART VS CONCURRENTS</CardDescription>
                  <span className="h-8 w-8 text-primary flex-shrink-0 flex items-center justify-center text-2xl font-bold">€</span>
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
              <CardHeader>
                <CardTitle>Évolution des tarifs</CardTitle>
              </CardHeader>
              <CardContent>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      interval={2}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      domain={[0, 200]} 
                      ticks={[0, 50, 100, 150, 200]}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <Tooltip content={<DashboardTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="monHotel" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMonHotel)"
                      name="Mon hôtel"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="moyenneConcurrents" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMoyenneConcurrents)"
                      name="Moyenne concurrents"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Tarif moyen</div>
                  <div className="text-3xl font-bold text-black">{avgPrice > 0 ? `${avgPrice}€` : 'N/A'}</div>
                </div>
                <div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Tarif le plus bas</div>
                  <div className="text-3xl font-bold text-black">129€</div>
                </div>
                <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 border border-red-400/40 shadow-lg">
                  <div className="text-xs text-black mb-1 font-medium">Écart moyen</div>
                  <div className="text-3xl font-bold text-black">{gap > 0 ? '+' : ''}{gap}€</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotels Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Hôtel</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.minOTA}€</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.booking}€</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.expedia}€</TableCell>
                      <TableCell className="text-right text-base py-4">{hotel.setConcurrent}€</TableCell>
                      <TableCell className="text-right py-4">
                        <Badge 
                          className={hotel.isPositive 
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm px-2 py-1" 
                            : "bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm px-2 py-1"
                          }
                        >
                          {hotel.delta > 0 ? '+' : ''}{hotel.delta}€
                        </Badge>
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
            </CardContent>
          </Card>
          </>
        </section>
      </main>
    </div>
  );
}
