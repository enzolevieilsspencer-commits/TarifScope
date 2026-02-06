"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  LineChart as LineChartIcon
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { toast } from "sonner";

// Mock data
// Les données sont maintenant chargées depuis l'API `/api/history`

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

const CustomTooltip = ({ active, payload, label, competitorMapping }: any) => {
  if (active && payload && payload.length && competitorMapping) {
    // Trier par l'ordre d'apparition dans competitorMapping
    const sortedPayload = competitorMapping
      .map((comp: any) => 
        payload.find((entry: any) => entry.dataKey === comp.name)
      )
      .filter(Boolean);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 min-w-[220px]">
        <div className="font-bold text-gray-900 mb-3">{label}</div>
        <div className="space-y-2">
          {sortedPayload.map((entry: any, index: number) => {
            const competitorName = entry.dataKey;
            const competitorInfo = competitorMapping.find((c: any) => c.name === competitorName);
            if (!competitorInfo) return null;
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: competitorInfo.color || "#3b82f6" }}
                />
                <span className="text-sm text-gray-700">
                  {competitorInfo.name || "Inconnu"}: <span className="font-bold text-gray-900">
                    {entry.value != null && entry.value !== "" ? `${Number(entry.value)} €` : "—"}
                  </span>
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

export default function HistoryPage() {
  const { isOpen } = useSidebar();
  const [periodFilter, setPeriodFilter] = useState("30days");
  const [chartType, setChartType] = useState("area");
  const [allPriceEvolutionData, setAllPriceEvolutionData] = useState<any[]>([]);
  const [hotelStats, setHotelStats] = useState<any[]>([]);
  const [competitorMapping, setCompetitorMapping] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données depuis l'API /api/history
  useEffect(() => {
    let isMounted = true;

    const fetchHistoryData = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);

        const response = await fetch("/api/history");
        if (!isMounted) return;

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || "Erreur lors du chargement de l'historique");
        }

        const data = await response.json();
        if (!isMounted) return;

        // Mapping des concurrents (pour les couleurs et les labels)
        setCompetitorMapping(data.competitorMapping || []);

        // Stats par hôtel
        setHotelStats(data.hotelStats || []);

        // Transformer les données : l'API envoie les prix par ID concurrent,
        // on remappe par nom pour le graphique. On garde null pour les absences (connectNulls).
        if (data.chartData && data.competitorMapping) {
          const transformed = data.chartData
            .map((row: any) => {
              const transformedRow: any = {
                date: row.date,
                dateISO: row.dateISO,
              };
              data.competitorMapping.forEach((comp: any) => {
                const value = row[comp.id];
                transformedRow[comp.name] = value != null && value !== "" ? Number(value) : null;
              });
              return transformedRow;
            })
            .sort((a: any, b: any) => (a.dateISO || "").localeCompare(b.dateISO || ""));

          setAllPriceEvolutionData(transformed);
        } else {
          setAllPriceEvolutionData([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique:", error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Erreur lors du chargement de l'historique");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistoryData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter data based on period
  const priceEvolutionData = useMemo(() => {
    if (periodFilter === "7days") {
      return allPriceEvolutionData.slice(-7);
    } else if (periodFilter === "90days") {
      return allPriceEvolutionData;
    }
    return allPriceEvolutionData.slice(-30);
  }, [allPriceEvolutionData, periodFilter]);

  // Domaine Y dynamique pour afficher correctement les prix enregistrés
  const chartDomainY = useMemo(() => {
    if (priceEvolutionData.length === 0) return undefined;
    const values: number[] = [];
    priceEvolutionData.forEach((row: any) => {
      Object.keys(row).forEach((key) => {
        if (key !== "date" && key !== "dateISO") {
          const v = row[key];
          if (typeof v === "number" && v > 0) values.push(v);
        }
      });
    });
    if (values.length === 0) return undefined;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(20, (max - min) * 0.1);
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)] as [number, number];
  }, [priceEvolutionData]);

  // Handle export CSV
  const handleExportCSV = () => {
    if (priceEvolutionData.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // Get all hotel names from the data
    const hotelNames = new Set<string>();
    priceEvolutionData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "date" && key !== "dateISO") {
          hotelNames.add(key);
        }
      });
    });

    const headers = ["Date", ...Array.from(hotelNames)];
    const rows = priceEvolutionData.map((row: any) => {
      const rowData = [row.date];
      hotelNames.forEach((hotelName) => {
        const v = row[hotelName];
        rowData.push(v != null && v !== "" ? String(Number(v)) : "");
      });
      return rowData;
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historique-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export CSV réussi !");
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Historique</h1>
              <p className="text-sm text-muted-foreground mt-1">Analysez l'évolution des tarifs dans le temps</p>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </header>

        <section className="flex-1 p-6 space-y-6 overflow-auto">
          <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-48">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="90days">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Ligne</SelectItem>
                <SelectItem value="bar">Barre</SelectItem>
                <SelectItem value="area">Aire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des tarifs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Chargement de l'historique...
                </div>
              ) : priceEvolutionData.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Aucune donnée historique disponible pour le moment.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={450}>
                  <AreaChart data={priceEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      {competitorMapping.map((comp: any) => (
                        <linearGradient key={`gradient-${comp.id}`} id={`color-${comp.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={comp.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={comp.color} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      domain={chartDomainY}
                    />
                    <Tooltip content={<CustomTooltip competitorMapping={competitorMapping} />} />
                    {competitorMapping.map((comp: any) => (
                      <Area 
                        key={comp.id}
                        type="monotone" 
                        dataKey={comp.name} 
                        stroke={comp.color} 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color-${comp.id})`}
                        name={comp.name}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Statistics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par hôtel</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Chargement des statistiques...
                </div>
              ) : hotelStats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Aucune statistique disponible pour le moment.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HÔTEL</TableHead>
                      <TableHead className="text-right">TARIF MOYEN</TableHead>
                      <TableHead className="text-right">MIN</TableHead>
                      <TableHead className="text-right">MAX</TableHead>
                      <TableHead className="text-right">TENDANCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotelStats.map((hotel) => (
                      <TableRow key={hotel.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${colorMap[hotel.color as keyof typeof colorMap]}`} />
                          <span className="font-medium">{hotel.name}</span>
                          {(hotel as any).isMyHotel && (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs">
                              Mon hôtel
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                        <TableCell className="text-right font-medium">{hotel.avgRate}€</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{hotel.min}€</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{hotel.max}€</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hotel.trend > 0 ? (
                              <>
                                <span className="text-red-600 font-medium">+{hotel.trend}%</span>
                                <TrendingUp className="h-4 w-4 text-red-600" />
                              </>
                            ) : (
                              <>
                                <span className="text-green-600 font-medium">{hotel.trend}%</span>
                                <TrendingDown className="h-4 w-4 text-green-600" />
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </>
        </section>
      </main>
    </div>
  );
}
