"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { ScrollText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LogEntry = {
  id: string;
  status: string;
  hotelId: string | null;
  hotelName: string | null;
  snapshotsCreated: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
};

export default function LogsPage() {
  const { isOpen } = useSidebar();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/scraper/logs?limit=50");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      toast.error("Erreur lors du chargement des logs");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const statusBadge = (status: string) => {
    const v = status === "success" ? "default" : status === "error" ? "destructive" : "secondary";
    return <Badge variant={v}>{status}</Badge>;
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-56" : "ml-20"}`}>
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Logs scraper</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dernières exécutions du scraper (Railway)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </header>
        <section className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Exécutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Chargement des logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Aucun log pour le moment. Les logs apparaîtront lorsque le scraper (Railway) aura été exécuté.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Début</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Hôtel</TableHead>
                      <TableHead className="text-right">Snapshots</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(log.startedAt)}
                        </TableCell>
                        <TableCell>{statusBadge(log.status)}</TableCell>
                        <TableCell>{log.hotelName ?? "—"}</TableCell>
                        <TableCell className="text-right">{log.snapshotsCreated}</TableCell>
                        <TableCell className="text-right">
                          {log.durationSeconds != null ? `${log.durationSeconds} s` : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={log.error ?? undefined}>
                          {log.error ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
