"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, Share2, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any; 
  coopName?: string;
  cashierName?: string;
}

export function ReceiptDialog({ open, onOpenChange, order, coopName, cashierName }: ReceiptDialogProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Fitur Bagikan Teks
  const handleShareText = async () => {
    const itemsList = order.items.map((item: any) => 
        `${item.productName} x${item.quantity || item.qty} = ${formatCurrency(item.price * (item.quantity || item.qty))}`
    ).join('\n');

    const receiptText = `
*STRUK TRANSAKSI*
${coopName || "KOPERASI MERAH PUTIH"}
${new Date(order.createdAt || order.date).toLocaleString('id-ID')}
--------------------------------
No: ${order.orderNumber}
Kasir: ${cashierName || '-'}
--------------------------------
${itemsList}
--------------------------------
Total: ${formatCurrency(order.totalAmount || order.total)}
Tunai: ${formatCurrency(order.cash || 0)}
Kembali: ${formatCurrency((order.cash || 0) - (order.totalAmount || order.total))}
--------------------------------
Terima Kasih
    `.trim();

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Struk Transaksi',
                text: receiptText,
            });
        } else {
            await navigator.clipboard.writeText(receiptText);
            toast.success("Teks struk disalin ke clipboard!");
        }
    } catch (error) {
        console.error("Gagal membagikan:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span>Transaksi Berhasil</span>
          </DialogTitle>
        </DialogHeader>

        {/* --- AREA STRUK VISUAL --- */}
        <div className="flex justify-center bg-zinc-100 p-4 rounded-xl print:p-0 print:bg-white print:m-0">
            <div 
                id="receipt-area"
                className="w-full bg-white p-6 shadow-sm print:shadow-none text-left font-mono text-[12px] leading-snug border border-zinc-200 print:border-none print:w-[58mm] print:p-0 print:mx-auto"
            >
                {/* Header Struk (Updated: Tanpa Alamat) */}
                <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-zinc-300 print:border-black">
                    <h3 className="font-bold text-sm uppercase mb-1">{coopName || "KOPERASI MERAH PUTIH"}</h3>
                    <p className="text-zinc-400 print:text-black">{new Date(order.createdAt || order.date).toLocaleString('id-ID')}</p>
                </div>
                
                {/* Info Transaksi */}
                <div className="mb-4 space-y-1">
                    <div className="flex justify-between"><span>No. Order</span><span>{order.orderNumber}</span></div>
                    {cashierName && <div className="flex justify-between"><span>Kasir</span><span>{cashierName}</span></div>}
                    <div className="flex justify-between"><span>Metode</span><span className="capitalize">{order.paymentMethod === 'pos_cash' ? 'Tunai' : order.paymentMethod}</span></div>
                </div>

                {/* List Item */}
                <div className="border-b-2 border-dashed border-zinc-300 mb-2 print:border-black"></div>
                <div className="space-y-2 mb-4">
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx}>
                            <div className="font-bold mb-0.5">{item.productName || item.name} {item.variant?.name ? `(${item.variant.name})` : ''}</div>
                            <div className="flex justify-between pl-2">
                                <span>{item.quantity || item.qty} x {formatCurrency(item.price)}</span>
                                <span>{formatCurrency(item.price * (item.quantity || item.qty))}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-b-2 border-dashed border-zinc-300 mb-3 print:border-black"></div>

                {/* Total & Pembayaran */}
                <div className="space-y-1">
                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{formatCurrency(order.totalAmount || order.total)}</span>
                    </div>
                    
                    {(order.cash !== undefined) && (
                        <>
                            <div className="flex justify-between mt-2">
                                <span>Bayar Tunai</span>
                                <span>{formatCurrency(order.cash)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali</span>
                                <span>{formatCurrency(order.cash - (order.totalAmount || order.total))}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Struk */}
                <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-zinc-300 text-zinc-400 print:text-black print:border-black">
                    <p className="font-bold mb-1">TERIMA KASIH</p>
                    <p className="print:hidden text-[9px]">Powered by CoopConnect</p>
                </div>
            </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 print:hidden">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Tutup
            </Button>
            <div className="flex gap-2 w-full">
                <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700" 
                    onClick={handleShareText}
                >
                    <Share2 className="w-4 h-4 mr-2" /> Bagikan Teks
                </Button>
                <Button 
                    className="flex-1 bg-zinc-800 hover:bg-zinc-900" 
                    onClick={handlePrint}
                >
                    <Printer className="w-4 h-4 mr-2" /> Cetak
                </Button>
            </div>
        </DialogFooter>

        {/* CSS Print Helper - Dioptimalkan untuk Printer Struk */}
        <style jsx global>{`
            @media print {
                /* Sembunyikan semua elemen UI aplikasi */
                body > *:not(.fixed) { display: none !important; }
                
                /* Reset margin/padding browser */
                @page { margin: 0; size: auto; }
                body { margin: 0; padding: 0; }

                /* Tampilkan Dialog sebagai root */
                .fixed { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; z-index: 9999 !important; background: white !important; padding: 0 !important; }
                
                /* Styling Area Struk untuk kertas 58mm */
                #receipt-area { 
                    width: 58mm !important; /* Lebar standar printer kasir kecil */
                    max-width: 100% !important;
                    margin: 0 !important; 
                    padding: 5px !important; 
                    border: none !important; 
                    box-shadow: none !important;
                    font-size: 10px !important; /* Font kecil agar muat */
                    font-family: 'Courier New', Courier, monospace !important; /* Font monospace klasik struk */
                    color: black !important;
                }

                /* Pastikan elemen di dalam struk terlihat */
                #receipt-area * { visibility: visible !important; }
                
                /* Sembunyikan elemen non-cetak */
                .print\\:hidden { display: none !important; }
            }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}