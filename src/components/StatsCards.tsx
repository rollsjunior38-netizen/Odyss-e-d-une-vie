import React from 'react';
import { Ticket, Users, CheckCircle2, Clock } from 'lucide-react';
import { CATEGORY_DETAILS, CATEGORY_LIMITS, Reservation, TicketCategory } from '../types';

interface StatsCardsProps {
  reservations: Reservation[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  reservations,
  selectedCategory,
  onSelectCategory,
}) => {
  const totalReservations = reservations.length;
  const totalPlaces = reservations.reduce((sum, r) => sum + r.seatsCount, 0);
  const totalRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0);

  const totalPaid = reservations
    .filter((r) => r.status === 'Payé')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalPending = reservations
    .filter((r) => r.status === 'Non Payé')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const categoryStats: Record<TicketCategory, { count: number; places: number; revenue: number }> = {
    Classic: { count: 0, places: 0, revenue: 0 },
    Silver: { count: 0, places: 0, revenue: 0 },
    Gold: { count: 0, places: 0, revenue: 0 },
  };

  reservations.forEach((r) => {
    if (categoryStats[r.category]) {
      categoryStats[r.category].count += 1;
      categoryStats[r.category].places += r.seatsCount;
      categoryStats[r.category].revenue += r.totalAmount;
    }
  });

  const totalMaxCapacity =
    CATEGORY_LIMITS.Gold.total + CATEGORY_LIMITS.Silver.total + CATEGORY_LIMITS.Classic.total;

  return (
    <div className="space-y-4">
      {/* Primary Financial & Volume Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Billets & Places */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Billets & Capacité</span>
            <Ticket className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono-tabular">
              {totalReservations}
            </span>
            <span className="text-xs text-neutral-400">/ {totalMaxCapacity} max</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1 font-mono-tabular">
            {totalPlaces} place{totalPlaces > 1 ? 's' : ''} réservée{totalPlaces > 1 ? 's' : ''}
          </div>
        </div>

        {/* Chiffre d'Affaires Global */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Chiffre Total</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-bold text-white font-mono-tabular">
            <span>{totalRevenue.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-normal text-amber-400">Ar</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Valeur totale réservée
          </div>
        </div>

        {/* Montant Payé / Encaissé */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400/90 mb-2">
            <span>Payé (Encaissé)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-bold text-emerald-400 font-mono-tabular">
            <span>{totalPaid.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-normal text-emerald-500">Ar</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1 font-mono-tabular">
            {totalRevenue > 0 ? `${Math.round((totalPaid / totalRevenue) * 100)}% encaissé` : '0%'}
          </div>
        </div>

        {/* Montant Non Payé / En attente */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-xs text-amber-400/90 mb-2">
            <span>Non Payé (En attente)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-bold text-amber-300 font-mono-tabular">
            <span>{totalPending.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-normal text-amber-500">Ar</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1 font-mono-tabular">
            À régler à l'entrée ou Mvola
          </div>
        </div>
      </div>

      {/* Category Breakdown & Filter Pills */}
      <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">
            Quotas et Limites Officielles par Catégorie
          </span>
          <span className="text-xs text-neutral-500">
            Gold: 001-059 · Silver: 100-200 · Classic: 300-400
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* All */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedCategory === 'all'
                ? 'bg-neutral-800 border-amber-500/60 shadow-sm ring-1 ring-amber-500/40'
                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-200">Toutes Catégories</span>
              <span className="text-[11px] font-mono-tabular text-neutral-400">
                {totalReservations} / {totalMaxCapacity}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1 font-mono-tabular">
              {totalPlaces} places
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Toutes les plages de billets
            </div>
          </button>

          {/* Classic */}
          <button
            onClick={() => onSelectCategory('Classic')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedCategory === 'Classic'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/40'
                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Classic (25 000 Ar)</span>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-neutral-950 px-1 rounded">
                300 - 400
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-white font-mono-tabular">
                {categoryStats.Classic.count} / {CATEGORY_LIMITS.Classic.total}
              </span>
              <span className="text-xs text-neutral-400 font-mono-tabular">
                {categoryStats.Classic.revenue.toLocaleString('fr-FR')} Ar
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 font-mono-tabular">
              {CATEGORY_LIMITS.Classic.total - categoryStats.Classic.count} billets restants
            </div>
          </button>

          {/* Silver */}
          <button
            onClick={() => onSelectCategory('Silver')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedCategory === 'Silver'
                ? 'bg-slate-800/60 border-slate-400/60 shadow-sm ring-1 ring-slate-400/40'
                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Silver (50 000 Ar)</span>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-neutral-950 px-1 rounded">
                100 - 200
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-white font-mono-tabular">
                {categoryStats.Silver.count} / {CATEGORY_LIMITS.Silver.total}
              </span>
              <span className="text-xs text-neutral-400 font-mono-tabular">
                {categoryStats.Silver.revenue.toLocaleString('fr-FR')} Ar
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 font-mono-tabular">
              {CATEGORY_LIMITS.Silver.total - categoryStats.Silver.count} billets restants
            </div>
          </button>

          {/* Gold */}
          <button
            onClick={() => onSelectCategory('Gold')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedCategory === 'Gold'
                ? 'bg-amber-950/40 border-amber-500/60 shadow-sm ring-1 ring-amber-500/40'
                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Gold (100 000 Ar)</span>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-neutral-950 px-1 rounded">
                001 - 059
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-white font-mono-tabular">
                {categoryStats.Gold.count} / {CATEGORY_LIMITS.Gold.total}
              </span>
              <span className="text-xs text-neutral-400 font-mono-tabular">
                {categoryStats.Gold.revenue.toLocaleString('fr-FR')} Ar
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 font-mono-tabular">
              {CATEGORY_LIMITS.Gold.total - categoryStats.Gold.count} billets restants
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

