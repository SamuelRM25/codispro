"use client";

import { useState } from "react";
import Link from "next/link";
import { useZxing } from "react-zxing";
import { ArrowLeft, Save, Scan, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ToolScannerPage() {
  const [result, setResult] = useState("");
  const [action, setAction] = useState<"CHECKOUT" | "RETURN">("CHECKOUT");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { ref } = useZxing({
    onResult(decoded) {
      const code = decoded.getText();
      if (code !== result && !loading) {
        setResult(code);
        handleScanAction(code, action);
      }
    },
    paused: loading || !!successMsg,
  });

  const handleScanAction = async (barcode: string, currentAction: string) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    // Suponemos que el operario ya tiene su sesión o lo elige de una lista
    // En MVP pasaremos null para WorkerId y el sistema lo atará al User Admin que escanea
    try {
      const res = await fetch("/api/tools/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode,
          action: currentAction,
          workerId: null 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          setSuccessMsg("");
          setResult("");
        }, 3000); // Reset after 3 seconds
      } else {
        setErrorMsg(data.error);
        setTimeout(() => {
          setErrorMsg("");
          setResult("");
        }, 4000);
      }
    } catch (err) {
      setErrorMsg("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/dashboard/tools">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Cámara Escáner de Bodega
        </h2>
      </div>

      <Card className="shadow-lg border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-orange-500"/>
            Modo de Operación
          </CardTitle>
          <CardDescription>
            Apunta la cámara al código de Barras o QR de la herramienta. 
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup defaultValue="CHECKOUT" onValueChange={(val) => setAction(val as "CHECKOUT" | "RETURN")} className="flex space-x-8 bg-muted p-4 rounded-xl">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CHECKOUT" id="checkout" />
              <Label htmlFor="checkout" className="font-bold text-orange-700 cursor-pointer">Prestar (Checkout)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="RETURN" id="return" />
              <Label htmlFor="return" className="font-bold text-green-700 cursor-pointer">Devolver (Return)</Label>
            </div>
          </RadioGroup>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-96 flex items-center justify-center mx-auto shadow-inner border-4 border-slate-200 dark:border-slate-800">
            {successMsg ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 text-white z-10 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-20 h-20 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black">{action === "CHECKOUT" ? "¡Prestada!" : "¡Devuelta!"}</h3>
                <p className="font-semibold">{successMsg}</p>
              </div>
            ) : errorMsg ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/90 text-white z-10 animate-in fade-in zoom-in duration-300 px-6 text-center">
                <Package className="w-20 h-20 mb-4 opacity-50" />
                <h3 className="text-2xl font-black">Error</h3>
                <p className="font-semibold">{errorMsg}</p>
              </div>
            ) : (
              <video ref={ref} className="w-full h-full object-cover" />
            )}
            
            {!successMsg && !errorMsg && (
              <div className="absolute inset-0 border-[3px] border-dashed border-white/50 m-12 rounded-3xl pointer-events-none" />
            )}
          </div>
          
          <div className="text-center font-mono bg-muted py-2 rounded-xl text-slate-500">
            {loading ? "Procesando código..." : result ? `Último Lectura: ${result}` : "Aguardando código..."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
