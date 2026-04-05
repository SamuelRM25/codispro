"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState("ISSUED");
  
  // Client/Supplier Details
  const [clientNit, setClientNit] = useState("CF");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("Ciudad");
  
  // Emit Company (Hardcoded demo)
  const [companyId, setCompanyId] = useState("cm28jkh8e000008jt4jkx5abc"); 
  
  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 }
  ]);

  const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subTotal * 0.12; 
  const total = subTotal + tax;

  const handleAddItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: invoiceType === "ISSUED" ? companyId : null,
          invoiceType,
          clientNit,
          clientName,
          clientAddress,
          items,
        }),
      });
      
      if (res.ok) {
        router.push("/dashboard/invoices");
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error saving document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Registro</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        <Card className="shadow-sm mb-6 border-blue-200">
          <CardHeader>
            <CardTitle>Tipo de Operación</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="ISSUED" value={invoiceType} onValueChange={(val) => setInvoiceType(val)} className="flex space-x-8">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ISSUED" id="issued" />
                <Label htmlFor="issued" className="font-semibold text-blue-700 cursor-pointer">Emitir a Cliente (Venta)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RECEIVED" id="received" />
                <Label htmlFor="received" className="font-semibold text-red-700 cursor-pointer">Ingresar Gasto de Proveedor (Compra)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>{invoiceType === "ISSUED" ? "Datos del Cliente (Receptor)" : "Datos del Proveedor (Emisor)"}</CardTitle>
            <CardDescription>
              {invoiceType === "ISSUED" 
                ? "Ingrese a quién se emitirá esta factura (DTE)."
                : "Ingrese el NIT y nombre de la empresa que le facturó a usted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nit">NIT o CUI</Label>
                <Input id="nit" value={clientNit} onChange={(e) => setClientNit(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Razón Social</Label>
                <Input id="name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg pb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Líneas de Detalle</CardTitle>
            </div>
            <Button type="button" variant="secondary" onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Fila
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Cantidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[150px]">Precio Unit.</TableHead>
                    <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)} required />
                      </TableCell>
                      <TableCell>
                        <Input value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} required placeholder="Descripción del producto o servicio" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)} required />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Q{(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Q{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (12%):</span>
                  <span>Q{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total:</span>
                  <span>Q{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4 border-t pt-6 bg-muted/20">
            <Link href="/dashboard/invoices">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading} className={invoiceType === "ISSUED" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}>
              {loading ? "Guardando..." : (invoiceType === "ISSUED" ? "Crear Borrador" : "Guardar Gasto")}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
