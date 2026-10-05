import React from 'react';
import { Calendar, MapPin, Clock, ShieldCheck, Ticket } from 'lucide-react';
import { EVENT_DETAILS } from '../types';
import heroImage from '../assets/images/concert_hero_odyssee_1791195872174.jpg';

interface EventHeroProps {
  onNewReservation: () => void;
  totalReservations: number;
}

export const EventHero: React.FC<EventHeroProps> = ({
  onNewReservation,
  totalReservations,
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl">
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Concert L'odyssée d'une Vie"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-7 md:p-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 tracking-widest uppercase px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              ÉVÉNEMENT MUSICAL OFFICIEL
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accès Responsables Synchronisé</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight text-balance">
            {EVENT_DETAILS.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
            Système centralisé de réservation de billets et billetterie pré-imprimée (PNG haute définition) pour les responsables et organisateurs.
          </p>

          {/* Event Metadata row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-neutral-300 pt-1 font-medium">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>17 Octobre 2026</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>15h00</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Cité des Cultures Antaninarenina</span>
            </div>
          </div>
        </div>

        {/* Pricing Summary Badge & CTA */}
        <div className="w-full md:w-auto bg-neutral-950/80 backdrop-blur-md border border-neutral-800/90 rounded-xl p-4 space-y-3 shrink-0">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Tarifs par Catégorie
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-neutral-900 border border-emerald-900/60">
              <div className="font-semibold text-emerald-400">Classic</div>
              <div className="font-bold text-white font-mono-tabular mt-0.5">25 000 Ar</div>
              <div className="text-[10px] text-amber-400 font-mono mt-1">N° 300 - 400</div>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-slate-700/60">
              <div className="font-semibold text-slate-300">Silver</div>
              <div className="font-bold text-white font-mono-tabular mt-0.5">50 000 Ar</div>
              <div className="text-[10px] text-amber-400 font-mono mt-1">N° 100 - 200</div>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-amber-900/60">
              <div className="font-semibold text-amber-400">Gold</div>
              <div className="font-bold text-white font-mono-tabular mt-0.5">100 000 Ar</div>
              <div className="text-[10px] text-amber-400 font-mono mt-1">N° 001 - 059</div>
            </div>
          </div>

          <button
            onClick={onNewReservation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow transition-all"
          >
            <Ticket className="w-4 h-4 text-neutral-950" />
            <span>Générer une Réservation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
