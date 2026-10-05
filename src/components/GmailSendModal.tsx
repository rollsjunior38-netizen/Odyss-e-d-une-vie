import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, AlertCircle, Sparkles, Paperclip, Loader2 } from 'lucide-react';
import { EVENT_DETAILS, Reservation } from '../types';
import { sendReservationTicketByEmail } from '../services/gmailApi';
import { getAccessToken, googleSignIn } from '../services/googleAuth';

interface GmailSendModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GmailSendModal: React.FC<GmailSendModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize email when reservation opens
  React.useEffect(() => {
    if (reservation) {
      setRecipientEmail(reservation.clientEmail || '');
      setCustomNote('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowConfirmDialog(false);
    }
  }, [reservation, isOpen]);

  if (!isOpen || !reservation) return null;

  const handleInitiateSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setErrorMsg('Veuillez saisir une adresse email valide.');
      return;
    }
    setErrorMsg('');

    // Check if user is logged in to Gmail
    const token = await getAccessToken();
    if (!token) {
      try {
        const signinRes = await googleSignIn();
        if (!signinRes) {
          setErrorMsg('Connexion Gmail requise pour envoyer cet email.');
          return;
        }
      } catch (err: any) {
        setErrorMsg('Échec de la connexion à Gmail : ' + err.message);
        return;
      }
    }

    // Open mandatory confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    setErrorMsg('');
    try {
      await sendReservationTicketByEmail(reservation, recipientEmail.trim(), customNote.trim());
      setSuccessMsg(`Billet envoyé avec succès à ${recipientEmail.trim()} via Gmail !`);
      setShowConfirmDialog(false);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Send email error:', err);
      setErrorMsg(err.message || 'Erreur lors de l\'envoi via Gmail');
      setShowConfirmDialog(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Envoyer le Billet par Gmail
              </h2>
              <p className="text-xs text-neutral-400">
                {EVENT_DETAILS.title} · Billet N° {reservation.ticketNumber}
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
        <form onSubmit={handleInitiateSend} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-800 text-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Ticket Summary Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Titulaire :</span>
              <span className="text-white font-bold">{reservation.clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Catégorie :</span>
              <span className="text-amber-400 font-semibold">
                {reservation.category} ({reservation.seatsCount} place{reservation.seatsCount > 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Statut Règlement :</span>
              <span
                className={`font-semibold ${
                  reservation.status === 'Payé' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {reservation.status === 'Payé' ? '✔ Payé' : '⏳ Non Payé (En attente)'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
              <span className="text-neutral-400">Date Concert :</span>
              <span className="text-neutral-200">{EVENT_DETAILS.dateFormatted}</span>
            </div>
          </div>

          {/* Recipient Email Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Adresse Email du Destinataire <span className="text-amber-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="ex: client@gmail.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Custom Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Message personnalisé ou consignes d'accès (Optionnel)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Merci pour votre réservation ! Présentez votre billet PNG à l'accueil de la Cité des Cultures..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Attachment preview note */}
          <div className="flex items-center gap-2 p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-lg text-xs text-neutral-400">
            <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Le ticket officiel pré-imprimé en format <strong>PNG haute résolution</strong> (avec QR code & code-barres) sera automatiquement joint au message.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800/60 rounded-lg"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSending || !!successMsg}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer via Gmail</span>
            </button>
          </div>
        </form>

        {/* MANDATORY USER CONFIRMATION DIALOG */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-20 bg-neutral-950/95 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Confirmation d'envoi Gmail</h3>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Êtes-vous sûr de vouloir envoyer cet email avec le billet officiel{' '}
                <strong className="text-amber-300 font-mono">{reservation.ticketNumber}</strong> à{' '}
                <strong className="text-white underline">{recipientEmail}</strong> depuis votre compte Gmail ?
              </p>

              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 space-y-1">
                <div><strong>Objet :</strong> Votre Billet Concert « {EVENT_DETAILS.title} »</div>
                <div><strong>Pièce jointe :</strong> Billet_{reservation.ticketNumber}.png</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSending}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow transition-all"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirmer et Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
