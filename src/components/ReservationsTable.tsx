import React, { useState } from 'react';
import {
  Search,
  Filter,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Ticket,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { CATEGORY_DETAILS, PaymentStatus, Reservation, TicketCategory } from '../types';

interface ReservationsTableProps {
  reservations: Reservation[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onViewTicket: (res: Reservation) => void;
  onEditReservation: (res: Reservation) => void;
  onDeleteReservation: (res: Reservation) => void;
  onToggleStatus: (res: Reservation) => void;
  onNewReservation: () => void;
  onSendEmail?: (res: Reservation) => void;
}

export const ReservationsTable: React.FC<ReservationsTableProps> = ({
  reservations,
  selectedCategory,
  onSelectCategory,
  onViewTicket,
  onEditReservation,
  onDeleteReservation,
  onToggleStatus,
  onNewReservation,
  onSendEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'ticket' | 'name' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered reservations
  const filtered = reservations
    .filter((res) => {
      // Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && res.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = res.clientName.toLowerCase().includes(query);
        const matchesTicket = res.ticketNumber.toLowerCase().includes(query);
        const matchesPhone = (res.clientPhone || '').toLowerCase().includes(query);
        const matchesResp = (res.responsibleName || '').toLowerCase().includes(query);
        const matchesNotes = (res.notes || '').toLowerCase().includes(query);
        return matchesName || matchesTicket || matchesPhone || matchesResp || matchesNotes;
      }
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortBy === 'date') {
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'ticket') {
        result = a.ticketNumber.localeCompare(b.ticketNumber);
      } else if (sortBy === 'name') {
        result = a.clientName.localeCompare(b.clientName);
      } else if (sortBy === 'amount') {
        result = a.totalAmount - b.totalAmount;
      }
      return sortOrder === 'desc' ? -result : result;
    });

  const toggleSort = (field: 'date' | 'ticket' | 'name' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, n° billet, téléphone, responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter('Payé')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'Payé'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                  : 'text-neutral-400 hover:text-emerald-400'
              }`}
            >
              Payé
            </button>
            <button
              onClick={() => setStatusFilter('Non Payé')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'Non Payé'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                  : 'text-neutral-400 hover:text-amber-400'
              }`}
            >
              Non Payé
            </button>
          </div>

          {/* Category Dropdown (Mobile or secondary) */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes Catégories</option>
              <option value="Classic">Classic (25k)</option>
              <option value="Silver">Silver (50k)</option>
              <option value="Gold">Gold (100k)</option>
            </select>
          </div>

          <span className="text-xs text-neutral-500 pl-1 font-mono-tabular">
            {filtered.length} / {reservations.length}
          </span>
        </div>
      </div>

      {/* Main Content: Table on desktop, Cards on mobile */}
      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-amber-400 mb-3.5 shadow-inner">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            {reservations.length === 0
              ? 'Aucune réservation enregistrée'
              : 'Aucun résultat correspondant aux filtres'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mt-1.5">
            {reservations.length === 0
              ? 'Le classeur est actuellement vierge. Vous pouvez commencer à saisir vos premières réservations et générer les billets pré-imprimés en format PNG.'
              : 'Essayez de modifier votre recherche ou vos filtres de statut/catégorie.'}
          </p>
          {reservations.length === 0 && (
            <div className="mt-5">
              <button
                onClick={onNewReservation}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-neutral-950" />
                <span>Créer la Première Réservation</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider text-[11px]">
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                    onClick={() => toggleSort('ticket')}
                  >
                    <div className="flex items-center gap-1">
                      <span>N° Billet</span>
                      {sortBy === 'ticket' && <ChevronDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Titulaire (Nom & Tél)</span>
                      {sortBy === 'name' && <ChevronDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Catégorie</th>
                  <th className="py-3 px-4 font-semibold text-right">Places</th>
                  <th
                    className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total (Ar)</span>
                      {sortBy === 'amount' && <ChevronDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Statut Règlement</th>
                  <th className="py-3 px-4 font-semibold">Responsable</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions Billet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filtered.map((res) => {
                  const catMeta = CATEGORY_DETAILS[res.category] || CATEGORY_DETAILS.Classic;
                  const isPaid = res.status === 'Payé';

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-neutral-850/60 transition-colors group"
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {res.ticketNumber}
                      </td>

                      {/* Client info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-sm">
                          {res.clientName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono-tabular">
                          <span>{res.clientPhone || 'Aucun numéro'}</span>
                          {res.clientEmail && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-red-400/90 truncate max-w-[120px]" title={res.clientEmail}>
                                {res.clientEmail}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${catMeta.badgeColor}`}
                        >
                          {res.category}
                        </span>
                        <div className="text-[11px] text-neutral-400 mt-0.5 font-mono-tabular">
                          {res.unitPrice.toLocaleString('fr-FR')} Ar / pl.
                        </div>
                      </td>

                      {/* Seats */}
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-neutral-200">
                        {res.seatsCount}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-white">
                        {res.totalAmount.toLocaleString('fr-FR')}{' '}
                        <span className="text-[11px] font-normal text-amber-400">Ar</span>
                      </td>

                      {/* Payment Status (Clickable quick toggle) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleStatus(res)}
                          title="Cliquez pour changer le statut (Payé / Non Payé)"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                            isPaid
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                          }`}
                        >
                          {isPaid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{res.status}</span>
                        </button>
                      </td>

                      {/* Responsible */}
                      <td className="py-3 px-4 text-neutral-300">
                        <div>{res.responsibleName || '—'}</div>
                        {res.notes && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-[140px]" title={res.notes}>
                            {res.notes}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send by Gmail */}
                          {onSendEmail && (
                            <button
                              onClick={() => onSendEmail(res)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md transition-colors"
                              title="Envoyer le billet par email via Gmail"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          {/* View Ticket PNG */}
                          <button
                            onClick={() => onViewTicket(res)}
                            className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-md transition-colors"
                            title="Voir & Télécharger le Ticket PNG"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditReservation(res)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                            title="Modifier la réservation"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteReservation(res)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="Supprimer la réservation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-neutral-800/80">
            {filtered.map((res) => {
              const catMeta = CATEGORY_DETAILS[res.category] || CATEGORY_DETAILS.Classic;
              const isPaid = res.status === 'Payé';

              return (
                <div key={res.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {res.ticketNumber}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${catMeta.badgeColor}`}
                      >
                        {res.category}
                      </span>
                    </div>

                    {/* Quick status toggle */}
                    <button
                      onClick={() => onToggleStatus(res)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                        isPaid
                          ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                          : 'bg-amber-950/70 border-amber-800 text-amber-300'
                      }`}
                    >
                      {isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{res.status}</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{res.clientName}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span>{res.clientPhone || 'Pas de tél.'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{res.seatsCount} place{res.seatsCount > 1 ? 's' : ''}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-amber-300 font-mono-tabular">
                        {res.totalAmount.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                  </div>

                  {res.notes && (
                    <div className="text-xs text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800/80">
                      <span className="text-neutral-500 font-medium">Note:</span> {res.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-xs">
                    <span className="text-neutral-500">
                      Par: <strong className="text-neutral-300">{res.responsibleName || 'Resp.'}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onSendEmail && (
                        <button
                          onClick={() => onSendEmail(res)}
                          className="p-1.5 text-red-400 hover:text-white bg-red-950/60 border border-red-800/60 rounded-md"
                          title="Envoyer par Gmail"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onViewTicket(res)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-md"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Ticket PNG</span>
                      </button>

                      <button
                        onClick={() => onEditReservation(res)}
                        className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-md"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteReservation(res)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 rounded-md"
                        title="Supprimer la réservation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
