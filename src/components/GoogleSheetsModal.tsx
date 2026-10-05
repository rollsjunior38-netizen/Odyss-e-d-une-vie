import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Download, FileSpreadsheet, Smartphone, CheckCircle } from 'lucide-react';
import { Reservation } from '../types';
import { copyReservationsForGoogleSheets, downloadReservationsCSV, exportReservationsToExcel } from '../utils/excelExport';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  reservations,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyTSV = () => {
    const tsv = copyReservationsForGoogleSheets(reservations);
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadExcel = () => {
    exportReservationsToExcel(reservations);
  };

  const handleDownloadCSV = () => {
    downloadReservationsCSV(reservations);
  };

  const handleOpenSheetsNew = () => {
    window.open('https://sheets.new', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Sauvegarder sur Google Sheets & Téléphone
              </h2>
              <p className="text-xs text-neutral-400">
                Synchronisation des réservations de "L'odyssée d'une Vie"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Method 1: Instant Copy & Paste into Google Sheets */}
          <div className="bg-neutral-950 border border-emerald-900/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-emerald-300">
                  Méthode la plus rapide : Copier & Coller direct
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono-tabular">
                {reservations.length} ligne{reservations.length > 1 ? 's' : ''} prête{reservations.length > 1 ? 's' : ''}
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Cliquez ci-dessous pour copier toutes les réservations, puis ouvrez Google Sheets et collez (<code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">Ctrl+V</code> ou Appui long sur smartphone). Toutes les colonnes (Billet, Nom, Catégorie, Places, Statut, etc.) se placent instantanément !
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleCopyTSV}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-neutral-950 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copié dans le presse-papier !' : 'Copier pour Google Sheets'}</span>
              </button>

              <button
                onClick={handleOpenSheetsNew}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors"
              >
                <span>Ouvrir Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Method 2: Save on Smartphone (Téléphone) & Drive */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-neutral-200">
                Sauvegarde sur Téléphone & Classeur Excel (.xlsx)
              </h3>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Téléchargez le classeur format Excel complet. Sur votre smartphone (Android / iPhone), le fichier peut être ouvert directement dans Microsoft Excel, WPS Office ou importé dans l'application Google Drive / Google Sheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Télécharger Classeur Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Fichier CSV</span>
              </button>
            </div>
          </div>

          {/* Quick instructions steps */}
          <div className="space-y-2 text-xs text-neutral-400 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
            <div className="font-semibold text-neutral-300">Procédure simple sur smartphone :</div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Téléchargez le classeur Excel via le bouton ci-dessus.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Ouvrez Google Drive ou Google Sheets sur votre téléphone, puis cliquez sur <strong>Importer</strong> et sélectionnez le fichier téléchargé.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Le tableau est prêt à être partagé avec les autres membres de l'organisation !</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
