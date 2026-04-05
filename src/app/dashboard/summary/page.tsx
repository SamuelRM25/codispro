"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Wrench, DollarSign, Package, FileText, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SummaryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summary")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-6 flex items-center justify-center min-h-[400px]">
        <Activity className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  // Combinar todos los movimientos en una sola lista para el timeline
  let timeline: any[] = [];
  
  data?.toolLoans?.forEach((loan: any) => {
    timeline.push({
      id: `loan_${loan.id}`,
      date: new Date(loan.createdAt),
      type: "TOOL",
      icon: Wrench,
      color: "bg-orange-500 text-white",
      title: "Préstamo de Herramienta",
      desc: `${loan.worker?.firstName || 'Usuario'} recibió ${loan.tool.name}`,
    });
  });

  data?.pettyCash?.forEach((cash: any) => {
    timeline.push({
      id: `cash_${cash.id}`,
      date: new Date(cash.createdAt),
      type: "CASH",
      icon: DollarSign,
      color: cash.type === "income" ? "bg-green-500 text-white" : "bg-red-500 text-white",
      title: cash.type === "income" ? "Ingreso a Caja Chica" : "Gasto de Caja Chica",
      desc: `${cash.description} - Q${cash.amount.toFixed(2)}`,
    });
  });

  data?.shipments?.forEach((ship: any) => {
    timeline.push({
      id: `ship_${ship.id}`,
      date: new Date(ship.createdAt),
      type: "SHIP",
      icon: Package,
      color: "bg-purple-500 text-white",
      title: "Nuevo Envío / Viaje",
      desc: `Vehículo ${ship.vehicle?.plate || 'NA'} conducido por ${ship.driver?.firstName || 'NA'}`,
    });
  });

  data?.invoices?.forEach((inv: any) => {
    timeline.push({
      id: `inv_${inv.id}`,
      date: new Date(inv.createdAt),
      type: "INVOICE",
      icon: FileText,
      color: inv.invoiceType === "ISSUED" ? "bg-blue-500 text-white" : "bg-red-500 text-white",
      title: inv.invoiceType === "ISSUED" ? "Factura Emitida" : "Factura de Gasto Recibida",
      desc: `Cliente: ${inv.client.name} - Total: Q${inv.total.toFixed(2)}`,
    });
  });

  data?.accessLogs?.forEach((log: any) => {
    timeline.push({
      id: `acc_${log.id}`,
      date: new Date(log.timestamp),
      type: "ACCESS",
      icon: Clock,
      color: "bg-slate-700 text-slate-100",
      title: "Terminal Biométrica",
      desc: `Ingreso registrado: ${log.worker?.firstName || 'Desconocido'} por puerta ${log.doorName}`,
    });
  });

  // Ordenar de más reciente a más antiguo
  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Resumen Diario
        </h2>
        <p className="text-muted-foreground">
          Visualiza todos los movimientos del sistema de forma secuencial
        </p>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle>Actividad del {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</CardTitle>
          <CardDescription>Eventos registrados hoy en todas las terminales y módulos</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-12 px-8">
          {timeline.length === 0 ? (
            <div className="text-center py-10 text-slate-500 italic">
              No hay movimientos registrados el día de hoy.
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-4 space-y-8">
              {timeline.map((item) => (
                <div key={item.id} className="relative pl-8">
                  <div className={`absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${item.color}`}>
                    <item.icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <time className="text-xs text-slate-500 font-medium">
                      {format(item.date, "hh:mm a")}
                    </time>
                  </div>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
