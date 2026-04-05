"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, CheckCircle, XCircle, MoreHorizontal, ArrowDownCircle, ArrowUpCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Invoice {
  id: string;
  invoiceType: string;
  numero: string | null;
  serie: string | null;
  cae: string | null;
  date: string;
  total: number;
  status: string;
  client: { name: string; nit: string };
  company: { name: string } | null;
  pdfUrl: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const certifyInvoice = async (id: string, type: string) => {
    if (type === "RECEIVED") return; // Safety check
    if (!confirm("¿Estás seguro de certificar esta factura ante la SAT? Esta acción es irreversible.")) return;

    try {
      const res = await fetch(`/api/invoices/${id}/certify`, { method: "POST" });
      if (res.ok) {
        alert("Factura certificada con éxito");
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  const filteredInvoices = invoices.filter((i) => 
    i.client.name.toLowerCase().includes(search.toLowerCase()) || 
    i.client.nit.includes(search) ||
    i.numero?.includes(search)
  );

  const issuedInvoices = filteredInvoices.filter(i => i.invoiceType !== "RECEIVED");
  const receivedInvoices = filteredInvoices.filter(i => i.invoiceType === "RECEIVED");

  const InvoiceTable = ({ data, isReceived = false }: { data: Invoice[], isReceived?: boolean }) => (
    <div className="rounded-md border bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Número/Serie</TableHead>
            <TableHead>{isReceived ? "Proveedor" : "Cliente"}</TableHead>
            {!isReceived && <TableHead>Empresa Emisora</TableHead>}
            <TableHead>Fecha</TableHead>
            <TableHead>Monto (GTQ)</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={isReceived ? 6 : 7} className="text-center h-24">Cargando facturas...</TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isReceived ? 6 : 7} className="text-center h-24 text-muted-foreground">
                No hay resultados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  {invoice.numero ? (
                    <div className="flex flex-col">
                      <span>{invoice.numero}</span>
                      <span className="text-xs text-muted-foreground">Serie: {invoice.serie}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      {isReceived ? "Registrada" : "Borrador"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{invoice.client.name}</span>
                    <span className="text-xs text-muted-foreground">{isReceived ? "NIT Proveedor" : "NIT"}: {invoice.client.nit}</span>
                  </div>
                </TableCell>
                {!isReceived && <TableCell>{invoice.company?.name || "N/A"}</TableCell>}
                <TableCell>{format(new Date(invoice.date), "PPP", { locale: es })}</TableCell>
                <TableCell className={`font-semibold ${isReceived ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                  {isReceived ? "-" : "+"} Q{invoice.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  {isReceived ? (
                    <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      Gasto Registrado
                    </Badge>
                  ) : invoice.status === "issued" ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="mr-1 h-3 w-3" /> Certificada
                    </Badge>
                  ) : invoice.status === "cancelled" ? (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" /> Anulada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
                      <FileText className="mr-1 h-3 w-3" /> Borrador
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invoice.id)}>Copiar ID</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!isReceived && invoice.status === "draft" && (
                        <DropdownMenuItem onClick={() => certifyInvoice(invoice.id, invoice.invoiceType)} className="text-blue-600 focus:bg-blue-50">
                          Certificar en SAT
                        </DropdownMenuItem>
                      )}
                      {(invoice.status === "draft" || isReceived) && (
                        <DropdownMenuItem onClick={() => deleteInvoice(invoice.id)} className="text-red-600 focus:bg-red-50">
                          Eliminar registro
                        </DropdownMenuItem>
                      )}
                      {!isReceived && invoice.status === "issued" && invoice.pdfUrl && (
                        <DropdownMenuItem asChild>
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">Descargar PDF</a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground mr-2 p-0 h-8 hover:bg-transparent hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">
            Gestión de Facturas
          </h2>
          <p className="text-muted-foreground">
            Controla tus ventas (Emisiones FEL) y compras (Gastos de terceros).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/invoices/new">
            <Button className="shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center pb-6 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, NIT o número..."
                className="pl-8 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="issued" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="issued" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Ventas Emitidas
              </TabsTrigger>
              <TabsTrigger value="received" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Gastos (Compras)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="issued">
              <InvoiceTable data={issuedInvoices} isReceived={false} />
            </TabsContent>
            
            <TabsContent value="received">
              <InvoiceTable data={receivedInvoices} isReceived={true} />
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  );
}
