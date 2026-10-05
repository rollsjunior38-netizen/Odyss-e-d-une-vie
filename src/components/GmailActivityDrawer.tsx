import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, Send, ExternalLink, Inbox } from 'lucide-react';
import { GmailMessageSummary, getRecentSentConfirmations } from '../services/gmailApi';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { EVENT_DETAILS } from '../types';

interface GmailActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GmailActivityDrawer: React.FC<GmailActivityDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      setIsAuthenticated(true);
      const list = await getRecentSentConfirmations();
      setMessages(list);
    } catch (err) {
      console.error('Error loading Gmail messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-800/60 flex items-center justify-center text-red-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Historique Gmail</h3>
              <p className="text-[11px] text-neutral-400">Billets & messages envoyés pour l'événement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {!isAuthenticated ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Connexion Gmail requise</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Connectez votre compte Google pour consulter les billets envoyés et l'historique des emails de confirmation.
              </p>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow"
              >
                <span>Se connecter à Gmail</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                <span>Derniers billets envoyés ({messages.length})</span>
                <button
                  onClick={loadMessages}
                  disabled={isLoading}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Chargement des messages Gmail...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-neutral-600" />
                  <p>Aucun email de billet envoyé pour le moment.</p>
                  <p className="text-[11px] text-neutral-600">
                    Utilisez le bouton « Envoyer par Gmail » sur une réservation pour transmettre le billet avec sa pièce jointe PNG.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate max-w-[220px]">
                          {msg.to || 'Destinataire'}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {msg.date ? new Date(msg.date).toLocaleDateString('fr-FR') : ''}
                        </span>
                      </div>
                      <div className="text-amber-400 font-medium truncate">
                        {msg.subject || 'Confirmation Billet'}
                      </div>
                      <p className="text-neutral-400 text-[11px] line-clamp-2 leading-relaxed">
                        {msg.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white"
          >
            <span>Ouvrir Gmail dans un onglet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-3 py-1 text-neutral-400 hover:text-white rounded bg-neutral-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
