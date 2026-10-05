import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Reservation } from '../types';

interface DeleteConfirmModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !reservation) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    try {
      await onConfirm(reservation.id);
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Impossible de supprimer cette réservation.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Supprimer le Billet
              </h3>
              <p className="text-xs text-neutral-400">
                Confirmation de suppression définitive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-red-950/60 border border-red-800 text-red-300 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Target Details Box */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Numéro de Billet :</span>
            <span className="font-mono font-bold text-amber-400">{reservation.ticketNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Nom du Titulaire :</span>
            <span className="font-semibold text-white">{reservation.clientName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Catégorie & Places :</span>
            <span className="text-neutral-200">
              {reservation.category} ({reservation.seatsCount} place{reservation.seatsCount > 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Montant Total :</span>
            <span className="font-mono font-bold text-amber-300">
              {reservation.totalAmount.toLocaleString('fr-FR')} Ar
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
            <span className="text-neutral-500">Statut :</span>
            <span
              className={reservation.status === 'Payé' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}
            >
              {reservation.status}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Êtes-vous sûr de vouloir supprimer cette réservation ? Elle sera retirée du classeur et ne figurera plus dans les totaux.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/80 rounded-lg transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
