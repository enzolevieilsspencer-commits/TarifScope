"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  BarChart3,
  ArrowDown,
  LayoutDashboard,
  Users,
  History,
  User,
  Hotel,
  Download,
  Upload,
  Plus,
  Copy,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const priceEvolutionData = [
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 min-w-[200px]">
        <div className="font-bold text-gray-900 mb-2 text-sm">{label}</div>
        <div className="space-y-1.5">
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
                <span className="text-xs text-gray-700">
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

export function DashboardPreview() {
  return (
    <div 
      className="rounded-2xl border bg-card shadow-2xl overflow-hidden pointer-events-none select-none"
      style={{ animation: 'floatDashboard 6s ease-in-out infinite' }}
    >
      {/* Browser Window */}
      <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-2.5">
        {/* Window Controls */}
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Address Bar */}
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg px-3 py-1.5 border border-gray-200">
          <svg className="h-4 w-4 text-gray-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <span className="text-sm text-gray-700">TarifScope.fr</span>
        </div>
        
        {/* Right Side Icons */}
        <div className="flex items-center gap-2">
          {/* Download Icon - Circle with arrow down */}
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12l4 4 4-4M12 8v8"/>
            </svg>
          </button>
          
          {/* Share/Upload Icon - Square with arrow up */}
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M12 8v8M8 12l4-4 4 4"/>
            </svg>
          </button>
          
          {/* Plus Icon */}
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
          
          {/* Duplicate/Copy Icon - Two overlapping squares */}
          <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r bg-card flex flex-col flex-shrink-0">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                  <Hotel className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">TarifScope</div>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-primary bg-primary/10">
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>Concurrents</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors">
                <History className="h-5 w-5 flex-shrink-0" />
                <span>Historique</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Bell className="h-5 w-5 flex-shrink-0" />
                <span>Alertes</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors">
                <User className="h-5 w-5 flex-shrink-0" />
                <span>Mon compte</span>
              </div>
            </nav>
          </div>
          <div className="p-4 border-t space-y-2">
            <button className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <span>Réduire</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 pb-4 border-b">
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-xs text-muted-foreground mt-1">Vue d'ensemble de votre veille tarifaire</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Select defaultValue="30j">
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="30 derniers jours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7j">7 derniers jours</SelectItem>
              <SelectItem value="30j">30 derniers jours</SelectItem>
              <SelectItem value="90j">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="monitored">Surveillés</SelectItem>
              <SelectItem value="not-monitored">Non surveillés</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-season">
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Toutes saisons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-season">Toutes saisons</SelectItem>
              <SelectItem value="summer">Été</SelectItem>
              <SelectItem value="winter">Hiver</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Rechercher un hôtel..." 
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <Card className="p-3">
          <div className="flex items-start justify-between mb-2">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-wide">HÔTELS SURVEILLÉS</CardDescription>
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold">6</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>+2 ce mois</span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between mb-2">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-wide">ALERTES ACTIVES</CardDescription>
            <Bell className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold">2</div>
          <div className="mt-1 text-xs text-muted-foreground">En surveillance</div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between mb-2">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-wide">TARIF MOYEN CONCURRENTS</CardDescription>
            <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold">197 €</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingDown className="h-3 w-3" />
            <span>-3.2% vs sem. dernière</span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between mb-2">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-wide">ÉCART VS CONCURRENTS</CardDescription>
            <span className="h-5 w-5 text-primary flex-shrink-0 flex items-center justify-center text-lg font-bold">€</span>
          </div>
          <div className="text-2xl font-bold">-6.1 %</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
            <ArrowDown className="h-3 w-3" />
            <span>En-dessous du marché</span>
          </div>
        </Card>
      </div>

      {/* Chart and Quick Overview Row */}
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        {/* Chart */}
        <Card className="lg:col-span-2 p-3">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base">Évolution des tarifs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={priceEvolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  interval={3}
                />
                <YAxis 
                  stroke="#6b7280" 
                  domain={[0, 200]} 
                  ticks={[0, 50, 100, 150, 200]}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                />
                <Tooltip content={<DashboardTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                  iconType="line"
                />
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
        <Card className="p-3">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base">Aperçu rapide</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-3 border border-blue-400/40 shadow-lg">
              <div className="text-[10px] text-black mb-1 font-medium">Mon tarif actuel</div>
              <div className="text-2xl font-bold text-black">185€</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-md rounded-lg p-3 border border-green-400/40 shadow-lg">
              <div className="text-[10px] text-black mb-1 font-medium">Tarif le plus bas</div>
              <div className="text-2xl font-bold text-black">115€</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-3 border border-red-400/40 shadow-lg">
              <div className="text-[10px] text-black mb-1 font-medium">Tarif le plus haut</div>
              <div className="text-2xl font-bold text-black">450€</div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}
