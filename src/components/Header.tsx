import React from 'react';
import { Plus, FileSpreadsheet, Share2, RefreshCw, Mail } from 'lucide-react';
import { User } from 'firebase/auth';
import { EVENT_DETAILS } from '../types';
import { GmailAuthButton } from './GmailAuthButton';

interface HeaderProps {
  onNewReservation: () => void;
  onExportExcel: () => void;
  onOpenGoogleSheets: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalReservations: number;
  currentUser: User | null;
  onAuthChange: (user: User | null, token: string | null) => void;
  onOpenGmailActivity: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewReservation,
  onExportExcel,
  onOpenGoogleSheets,
  onRefresh,
  isRefreshing,
  totalReservations,
  currentUser,
  onAuthChange,
  onOpenGmailActivity,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-600/30 to-amber-700/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-display text-lg font-bold shadow-inner">
              OV
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-display">
                {EVENT_DETAILS.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{EVENT_DETAILS.dateFormatted}</span>
                <span aria-hidden="true">·</span>
                <span className="hidden sm:inline">{EVENT_DETAILS.venue}</span>
              </div>
            </div>
          </div>

          {/* Mobile Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Rafraîchir les données"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Desktop */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap"
            title="Synchroniser avec le serveur"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Synchroniser</span>
          </button>

          {/* Gmail Activity / Sent drawer button */}
          <button
            onClick={onOpenGmailActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 rounded-lg transition-colors whitespace-nowrap"
            title="Consulter l'historique des emails de billets envoyés"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span>Historique Gmail</span>
          </button>

          {/* Gmail Auth Button */}
          <GmailAuthButton currentUser={currentUser} onAuthChange={onAuthChange} />

          {/* Google Sheets Modal Button */}
          <button
            onClick={onOpenGoogleSheets}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-lg transition-colors whitespace-nowrap"
            title="Exporter ou synchroniser vers Google Sheets"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            title="Télécharger le classeur Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Classeur Excel</span>
          </button>

          {/* New Reservation Primary CTA */}
          <button
            onClick={onNewReservation}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md hover:shadow-amber-500/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-neutral-950" />
            <span>Nouvelle Réservation</span>
          </button>
        </div>
      </div>
    </header>
  );
};

