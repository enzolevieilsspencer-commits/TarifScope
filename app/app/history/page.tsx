"use client";

import { useState, useMemo } from "react";
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
const initialPriceEvolutionData = [
  { date: "17 déc.", "Le Grand Hotel": 129, "Hôtel Rivage": 139, "Hôtel Lumière": 145 },
  { date: "18 déc.", "Le Grand Hotel": 132, "Hôtel Rivage": 141, "Hôtel Lumière": 147 },
  { date: "19 déc.", "Le Grand Hotel": 130, "Hôtel Rivage": 140, "Hôtel Lumière": 146 },
  { date: "20 déc.", "Le Grand Hotel": 135, "Hôtel Rivage": 143, "Hôtel Lumière": 149 },
  { date: "21 déc.", "Le Grand Hotel": 133, "Hôtel Rivage": 142, "Hôtel Lumière": 148 },
  { date: "22 déc.", "Le Grand Hotel": 137, "Hôtel Rivage": 145, "Hôtel Lumière": 151 },
  { date: "23 déc.", "Le Grand Hotel": 136, "Hôtel Rivage": 144, "Hôtel Lumière": 150 },
  { date: "24 déc.", "Le Grand Hotel": 140, "Hôtel Rivage": 147, "Hôtel Lumière": 153 },
  { date: "25 déc.", "Le Grand Hotel": 138, "Hôtel Rivage": 145, "Hôtel Lumière": 151 },
  { date: "26 déc.", "Le Grand Hotel": 135, "Hôtel Rivage": 142, "Hôtel Lumière": 148 },
  { date: "27 déc.", "Le Grand Hotel": 139, "Hôtel Rivage": 146, "Hôtel Lumière": 152 },
  { date: "28 déc.", "Le Grand Hotel": 141, "Hôtel Rivage": 148, "Hôtel Lumière": 154 },
  { date: "29 déc.", "Le Grand Hotel": 140, "Hôtel Rivage": 147, "Hôtel Lumière": 153 },
  { date: "30 déc.", "Le Grand Hotel": 143, "Hôtel Rivage": 150, "Hôtel Lumière": 156 },
  { date: "31 déc.", "Le Grand Hotel": 142, "Hôtel Rivage": 149, "Hôtel Lumière": 155 },
  { date: "1 janv.", "Le Grand Hotel": 140, "Hôtel Rivage": 147, "Hôtel Lumière": 153 },
  { date: "2 janv.", "Le Grand Hotel": 138, "Hôtel Rivage": 145, "Hôtel Lumière": 151 },
  { date: "3 janv.", "Le Grand Hotel": 141, "Hôtel Rivage": 148, "Hôtel Lumière": 154 },
  { date: "4 janv.", "Le Grand Hotel": 137, "Hôtel Rivage": 144, "Hôtel Lumière": 150 },
  { date: "5 janv.", "Le Grand Hotel": 135, "Hôtel Rivage": 142, "Hôtel Lumière": 148 },
  { date: "6 janv.", "Le Grand Hotel": 139, "Hôtel Rivage": 146, "Hôtel Lumière": 152 },
  { date: "7 janv.", "Le Grand Hotel": 138, "Hôtel Rivage": 145, "Hôtel Lumière": 151 },
  { date: "8 janv.", "Le Grand Hotel": 142, "Hôtel Rivage": 149, "Hôtel Lumière": 155 },
  { date: "9 janv.", "Le Grand Hotel": 141, "Hôtel Rivage": 148, "Hôtel Lumière": 154 },
  { date: "10 janv.", "Le Grand Hotel": 140, "Hôtel Rivage": 147, "Hôtel Lumière": 153 },
  { date: "11 janv.", "Le Grand Hotel": 139, "Hôtel Rivage": 146, "Hôtel Lumière": 152 },
  { date: "12 janv.", "Le Grand Hotel": 143, "Hôtel Rivage": 150, "Hôtel Lumière": 156 },
  { date: "13 janv.", "Le Grand Hotel": 142, "Hôtel Rivage": 149, "Hôtel Lumière": 155 },
  { date: "14 janv.", "Le Grand Hotel": 144, "Hôtel Rivage": 151, "Hôtel Lumière": 157 },
];

const initialHotelStats = [
  { id: 1, name: "Le Grand Hotel", avgRate: 138, min: 129, max: 144, trend: 11.6, color: "blue", isMyHotel: false },
  { id: 2, name: "Hôtel Rivage", avgRate: 145, min: 139, max: 151, trend: 8.6, color: "green", isMyHotel: false },
  { id: 3, name: "Hôtel Lumière", avgRate: 151, min: 145, max: 157, trend: 9.3, color: "orange", isMyHotel: false },
];

const initialCompetitorMapping = [
  { id: 1, name: "Le Grand Hotel", color: "#3b82f6", colorName: "blue" },
  { id: 2, name: "Hôtel Rivage", color: "#22c55e", colorName: "green" },
  { id: 3, name: "Hôtel Lumière", color: "#f97316", colorName: "orange" },
];

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
                  {competitorInfo.name || "Inconnu"}: <span className="font-bold text-gray-900">{entry.value}€</span>
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
  const [allPriceEvolutionData] = useState(initialPriceEvolutionData);
  const [hotelStats] = useState(initialHotelStats);
  const [competitorMapping] = useState(initialCompetitorMapping);

  // Filter data based on period
  const priceEvolutionData = useMemo(() => {
    if (periodFilter === "7days") {
      return allPriceEvolutionData.slice(-7);
    } else if (periodFilter === "90days") {
      return allPriceEvolutionData;
    }
    return allPriceEvolutionData.slice(-30);
  }, [allPriceEvolutionData, periodFilter]);

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
        rowData.push((row[hotelName] || 0).toString());
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
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statistics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par hôtel</CardTitle>
            </CardHeader>
            <CardContent>
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
                          {hotel.isMyHotel && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Mon hôtel</Badge>
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
            </CardContent>
          </Card>
          </>
        </section>
      </main>
    </div>
  );
}
