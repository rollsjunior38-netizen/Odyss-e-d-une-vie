import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Share2, Check, Sparkles, Mail, Trash2 } from 'lucide-react';
import { Reservation } from '../types';
import { downloadTicketPNG, generateTicketPNG } from '../utils/ticketCanvas';

interface TicketPreviewModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onSendEmail?: (reservation: Reservation) => void;
  onDeleteTicket?: (reservation: Reservation) => void;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  reservation,
  onClose,
  onSendEmail,
  onDeleteTicket,
}) => {
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!reservation) {
      setPngDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    generateTicketPNG(reservation)
      .then((url) => {
        if (isMounted) {
          setPngDataUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate ticket PNG:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reservation]);

  if (!reservation) return null;

  const handleDownload = () => {
    downloadTicketPNG(reservation);
  };

  const handlePrint = () => {
    if (!pngDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billet - ${reservation.ticketNumber} - ${reservation.clientName}</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; font-family: sans-serif; }
            img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          </style>
        </head>
        <body>
          <img src="${pngDataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share && pngDataUrl) {
      try {
        const response = await fetch(pngDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `Ticket_${reservation.ticketNumber}.png`, { type: 'image/png' });

        await navigator.share({
          title: `Billet Concert L'odyssée d'une Vie - ${reservation.ticketNumber}`,
          text: `Réservation pour ${reservation.clientName} - Catégorie ${reservation.category} (${reservation.seatsCount} places). Samedi 17 Octobre 2026 à Cité des Cultures.`,
          files: [file],
        });
        return;
      } catch (e) {
        // Fallback to text copy or standard download
      }
    }

    // Fallback: copy ticket summary to clipboard
    const text = `🎟️ Billet "L'odyssée d'une Vie" - 17 Octobre 2026 à 15h00 (Cité des Cultures Antaninarenina)\nBillet N°: ${reservation.ticketNumber}\nTitulaire: ${reservation.clientName}\nCatégorie: ${reservation.category} (${reservation.unitPrice.toLocaleString('fr-FR')} Ar)\nPlaces: ${reservation.seatsCount}\nTotal: ${reservation.totalAmount.toLocaleString('fr-FR')} Ar\nStatut: ${reservation.status}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-amber-400 font-display">TICKET PRÉ-IMPRIMÉ PNG</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300 font-mono-tabular">{reservation.ticketNumber}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400 font-semibold">{reservation.category}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Réservation : {reservation.clientName} ({reservation.seatsCount} place{reservation.seatsCount > 1 ? 's' : ''})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Ticket Image Preview */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3 sm:p-4 flex items-center justify-center min-h-[260px] sm:min-h-[340px] relative overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-neutral-400 text-sm">
                <Sparkles className="w-6 h-6 animate-pulse text-amber-400" />
                <span>Génération du ticket haute résolution en cours...</span>
              </div>
            ) : pngDataUrl ? (
              <img
                src={pngDataUrl}
                alt={`Ticket ${reservation.ticketNumber}`}
                className="w-full max-h-[460px] object-contain rounded-lg shadow-2xl border border-neutral-800"
              />
            ) : (
              <div className="text-neutral-400 text-sm">
                Erreur de génération du ticket.
              </div>
            )}
          </div>

          {/* Quick Info bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-neutral-950 border border-neutral-800/80 rounded-lg p-3">
            <div>
              <span className="text-neutral-500 block">Événement :</span>
              <span className="text-neutral-200 font-semibold">L'odyssée d'une Vie</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Date & Lieu :</span>
              <span className="text-neutral-200 font-semibold">17 Octobre 2026 • 15h</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Montant Total :</span>
              <span className="text-amber-400 font-bold font-mono-tabular">
                {reservation.totalAmount.toLocaleString('fr-FR')} Ar
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Statut Règlement :</span>
              <span
                className={`font-semibold ${
                  reservation.status === 'Payé' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {reservation.status === 'Payé' ? '✔ Payé (Validé)' : '⏳ Non Payé (En attente)'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            Format PNG haute définition • Prêt pour WhatsApp, impression ou archivage
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Send via Gmail button */}
            {onSendEmail && (
              <button
                onClick={() => onSendEmail(reservation)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900/60 border border-red-800/70 rounded-lg transition-colors"
                title="Envoyer le billet avec la pièce jointe PNG par email via Gmail"
              >
                <Mail className="w-4 h-4 text-red-400" />
                <span>Envoyer par Gmail</span>
              </button>
            )}

            {/* Share / Copy button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Copié !' : 'Partager'}</span>
            </button>

            {/* Delete ticket button */}
            {onDeleteTicket && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteTicket(reservation);
                }}
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 border border-neutral-700/60 rounded-lg transition-colors"
                title="Supprimer ce billet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={!pngDataUrl}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Imprimer</span>
            </button>

            {/* Download PNG Primary CTA */}
            <button
              onClick={handleDownload}
              disabled={!pngDataUrl}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md transition-all"
            >
              <Download className="w-4 h-4 text-neutral-950" />
              <span>Télécharger le Ticket PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
