import React, { useState, useEffect } from 'react';
import { X, Ticket, User, Phone, Check, CreditCard, Sparkles, UserCheck, Mail, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  CATEGORY_DETAILS,
  CATEGORY_LIMITS,
  CATEGORY_PRICES,
  EVENT_DETAILS,
  PaymentMethod,
  PaymentStatus,
  Reservation,
  TicketCategory,
  getNextAvailableTicket,
  validateTicketAssignment,
  extractTicketNumericValue,
} from '../types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Reservation, generatePNGAfter: boolean) => Promise<void>;
  editingReservation?: Reservation | null;
  existingReservations: Reservation[];
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReservation,
  existingReservations,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Classic');
  const [seatsCount, setSeatsCount] = useState<number>(1);
  const [status, setStatus] = useState<PaymentStatus>('Payé');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Espèces');
  const [ticketNumber, setTicketNumber] = useState('');
  const [responsibleName, setResponsibleName] = useState(() => {
    return localStorage.getItem('last_responsible_name') || 'Responsable Billetterie';
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load when modal opens or editingReservation changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingReservation) {
      setClientName(editingReservation.clientName);
      setClientPhone(editingReservation.clientPhone || '');
      setClientEmail(editingReservation.clientEmail || '');
      setCategory(editingReservation.category);
      setSeatsCount(editingReservation.seatsCount);
      setStatus(editingReservation.status);
      setPaymentMethod(editingReservation.paymentMethod || 'Espèces');
      setTicketNumber(editingReservation.ticketNumber);
      setResponsibleName(editingReservation.responsibleName || '');
      setNotes(editingReservation.notes || '');
      setErrorMsg('');
    } else {
      // New reservation default
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setCategory('Classic');
      setSeatsCount(1);
      setStatus('Payé');
      setPaymentMethod('Espèces');
      setNotes('');
      setErrorMsg('');
      const nextNum = getNextAvailableTicket('Classic', existingReservations);
      setTicketNumber(nextNum || 'ODYS-CLS-300');
    }
  }, [editingReservation, isOpen]);

  // When category changes, auto-propose next valid number if creating or if current number doesn't fit
  const handleCategoryChange = (newCat: TicketCategory) => {
    setCategory(newCat);
    setErrorMsg('');

    // If editing and original reservation was already this category, preserve original ticket number
    if (editingReservation && editingReservation.category === newCat) {
      setTicketNumber(editingReservation.ticketNumber);
      return;
    }

    const nextAvail = getNextAvailableTicket(newCat, existingReservations, editingReservation?.id);
    if (nextAvail) {
      setTicketNumber(nextAvail);
    } else {
      const limit = CATEGORY_LIMITS[newCat];
      setTicketNumber(`${limit.prefix}-${String(limit.min).padStart(3, '0')}`);
      setErrorMsg(`Attention : Le quota pour la catégorie ${newCat} (${limit.rangeLabel}) semble complet !`);
    }
  };

  const handleSuggestNextTicket = () => {
    const nextAvail = getNextAvailableTicket(category, existingReservations, editingReservation?.id);
    if (nextAvail) {
      setTicketNumber(nextAvail);
      setErrorMsg('');
    } else {
      setErrorMsg(`Tous les numéros pour ${category} (${CATEGORY_LIMITS[category].rangeLabel}) sont déjà réservés.`);
    }
  };

  if (!isOpen) return null;

  const unitPrice = CATEGORY_PRICES[category];
  const totalAmount = unitPrice * seatsCount;

  // Real-time check of ticket number
  const currentValidation = validateTicketAssignment(category, ticketNumber, existingReservations, editingReservation?.id);

  // Compute category capacity statistics
  const getCategoryCount = (cat: TicketCategory) => {
    return existingReservations.filter((r) => {
      if (editingReservation && r.id === editingReservation.id) return false;
      return r.category === cat;
    }).length;
  };

  const handleSubmit = async (generatePNG: boolean) => {
    if (!clientName.trim()) {
      setErrorMsg('Veuillez entrer le nom du titulaire de la réservation.');
      return;
    }
    if (!ticketNumber.trim()) {
      setErrorMsg('Veuillez renseigner un numéro de billet valide.');
      return;
    }

    // Strict quota & range verification
    const valResult = validateTicketAssignment(category, ticketNumber, existingReservations, editingReservation?.id);
    if (!valResult.valid) {
      setErrorMsg(valResult.error || 'Numéro de billet non conforme.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    // Save responsible name in local storage for convenience
    if (responsibleName.trim()) {
      localStorage.setItem('last_responsible_name', responsibleName.trim());
    }

    const finalTicketCode = valResult.normalized || ticketNumber.trim().toUpperCase();

    const payload: Reservation = {
      id: editingReservation ? editingReservation.id : `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      category,
      unitPrice,
      seatsCount,
      totalAmount,
      status,
      paymentMethod,
      ticketNumber: finalTicketCode,
      responsibleName: responsibleName.trim() || 'Responsable Billetterie',
      notes: notes.trim(),
      createdAt: editingReservation ? editingReservation.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(payload, generatePNG);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'enregistrement de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
                {EVENT_DETAILS.title}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">17 Octobre 2026 à 15h00</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-display mt-0.5">
              {editingReservation ? `Modifier la Réservation · ${editingReservation.ticketNumber}` : 'Nouvelle Réservation & Billet'}
            </h2>
            {editingReservation && (
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Accessible et modifiable en ligne par tous les responsables de l'organisation.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-950/70 border border-red-800 text-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category Selector with Quota & Limits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Catégorie de Billet & Limite Attribuée
              </label>
              <span className="text-[11px] text-neutral-500">
                Numérotation stricte par catégorie
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['Classic', 'Silver', 'Gold'] as TicketCategory[]).map((cat) => {
                const isSel = category === cat;
                const meta = CATEGORY_DETAILS[cat];
                const limit = CATEGORY_LIMITS[cat];
                const usedCount = getCategoryCount(cat);
                const isFull = usedCount >= limit.total;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSel
                        ? cat === 'Gold'
                          ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500'
                          : cat === 'Silver'
                          ? 'bg-slate-800/80 border-slate-300 shadow-md ring-1 ring-slate-300'
                          : 'bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          {cat === 'Gold' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{meta.name}</span>
                        </div>
                        {isSel && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="text-sm font-semibold font-mono-tabular text-amber-400 mt-1">
                        {meta.price.toLocaleString('fr-FR')} Ar
                      </div>

                      {/* Quota Range badge */}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-950/80 border border-neutral-800 text-neutral-200">
                        <span>Plage :</span>
                        <span className="text-amber-400">{limit.rangeLabel}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Émis :</span>
                      <span className={`font-mono-tabular font-bold ${isFull ? 'text-red-400' : 'text-neutral-200'}`}>
                        {usedCount} / {limit.total} {isFull ? '(COMPLET)' : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nom & Prénom <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Ravelomanana Andry"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Numéro de Téléphone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="Ex: 034 12 345 67..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Adresse Email (Envoi Gmail)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="Ex: client@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Seats, Ticket Number & Limits Check */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Seats count */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nombre de Places
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                  className="w-9 h-9 flex items-center justify-center bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 text-base font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={seatsCount}
                  onChange={(e) => setSeatsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg py-2 text-center text-sm font-bold text-white font-mono-tabular focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSeatsCount(seatsCount + 1)}
                  className="w-9 h-9 flex items-center justify-center bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 text-base font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ticket Number with limits validation */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Numéro du Billet (Limite {CATEGORY_LIMITS[category].rangeLabel})
                </label>
                <button
                  type="button"
                  onClick={handleSuggestNextTicket}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                  title="Calculer le prochain numéro disponible dans la plage autorisée"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>N° Suivant libre</span>
                </button>
              </div>

              <div className="relative">
                <Ticket className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder={`Ex: ${CATEGORY_LIMITS[category].prefix}-${String(CATEGORY_LIMITS[category].min).padStart(3, '0')}`}
                  className={`w-full bg-neutral-950 border rounded-lg pl-9 pr-3 py-2 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none ${
                    currentValidation.valid
                      ? 'border-emerald-600/80 text-emerald-300 focus:border-emerald-500'
                      : 'border-red-600/80 text-red-300 focus:border-red-500'
                  }`}
                />
              </div>

              {/* Real-time validation feedback */}
              <div className="mt-1 flex items-center justify-between text-[11px]">
                {currentValidation.valid ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Numéro valide dans la plage {CATEGORY_LIMITS[category].rangeLabel}</span>
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{currentValidation.error}</span>
                  </span>
                )}
                <span className="text-neutral-500 font-mono">
                  {category} : {CATEGORY_LIMITS[category].rangeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Highlight Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              <span>Tarif unitaire : </span>
              <span className="font-semibold text-neutral-200 font-mono-tabular">
                {unitPrice.toLocaleString('fr-FR')} Ar
              </span>
              <span className="mx-1">×</span>
              <span className="font-semibold text-neutral-200 font-mono-tabular">
                {seatsCount} {seatsCount > 1 ? 'places' : 'place'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                Montant Total
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono-tabular">
                {totalAmount.toLocaleString('fr-FR')} Ariary
              </div>
            </div>
          </div>

          {/* Payment Status & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Statut de Paiement
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Payé')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    status === 'Payé'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payé</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Non Payé')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    status === 'Non Payé'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Non Payé</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mode de Paiement
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Espèces">Espèces (Cash)</option>
                  <option value="Mvola">Mvola</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Virement / Chèque">Virement / Chèque</option>
                  <option value="En attente">En attente (Paiement sur place)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Responsible & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nom du Responsable (Saisie)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: Rolls, Jean, Aina..."
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Remarques / Placement / Notes
              </label>
              <input
                type="text"
                placeholder="Ex: Rangée centrale, récupérer avant 14h..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-lg transition-colors order-2 sm:order-1"
          >
            Annuler
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              Enregistrer
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-neutral-950" />
              <span>Enregistrer & Générer Ticket PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
