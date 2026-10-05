/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { EventHero } from './components/EventHero';
import { StatsCards } from './components/StatsCards';
import { ReservationsTable } from './components/ReservationsTable';
import { ReservationModal } from './components/ReservationModal';
import { TicketPreviewModal } from './components/TicketPreviewModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GmailSendModal } from './components/GmailSendModal';
import { GmailActivityDrawer } from './components/GmailActivityDrawer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Reservation } from './types';
import { exportReservationsToExcel } from './utils/excelExport';
import { initAuth } from './services/googleAuth';

export default function App() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Google / Gmail User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [previewTicket, setPreviewTicket] = useState<Reservation | null>(null);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [gmailSendReservation, setGmailSendReservation] = useState<Reservation | null>(null);
  const [isGmailActivityOpen, setIsGmailActivityOpen] = useState(false);
  const [deletingReservation, setDeletingReservation] = useState<Reservation | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load reservations from server
  const fetchReservations = useCallback(async (showSpin = true) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const res = await fetch('/api/reservations');
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      } else {
        console.error('Erreur de chargement des réservations:', res.statusText);
      }
    } catch (err) {
      console.error('Erreur réseau fetch reservations:', err);
    } finally {
      setIsLoading(false);
      if (showSpin) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(false);

    // Auto-sync polling every 15 seconds so multiple managers stay up-to-date
    const interval = setInterval(() => {
      fetchReservations(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchReservations]);

  // Open modal for new reservation
  const handleOpenNew = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (res: Reservation) => {
    setEditingReservation(res);
    setIsModalOpen(true);
  };

  // Save (create or update)
  const handleSaveReservation = async (reservation: Reservation, generatePNGAfter: boolean) => {
    const isEdit = !!editingReservation;
    const url = isEdit ? `/api/reservations/${reservation.id}` : '/api/reservations';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Erreur lors de la sauvegarde sur le serveur');
    }

    const saved = await response.json();

    setReservations((prev) => {
      if (isEdit) {
        return prev.map((r) => (r.id === saved.id ? saved : r));
      } else {
        return [saved, ...prev];
      }
    });

    if (generatePNGAfter) {
      setPreviewTicket(saved);
    }
  };

  // Quick toggle status between 'Payé' and 'Non Payé'
  const handleToggleStatus = async (res: Reservation) => {
    const newStatus = res.status === 'Payé' ? 'Non Payé' : 'Payé';
    const updated: Reservation = {
      ...res,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`/api/reservations/${res.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (response.ok) {
        setReservations((prev) => prev.map((r) => (r.id === res.id ? updated : r)));
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  // Delete Request (Opens fail-safe custom confirmation modal)
  const handleDeleteRequest = (res: Reservation) => {
    setDeletingReservation(res);
  };

  // Confirmed Delete execution on server and local state
  const handleConfirmDelete = async (id: string) => {
    const response = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Erreur lors de la suppression sur le serveur');
    }

    setReservations((prev) => prev.filter((r) => r.id !== id && r.ticketNumber !== id));
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportReservationsToExcel(reservations);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        onNewReservation={handleOpenNew}
        onExportExcel={handleExportExcel}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        onRefresh={() => fetchReservations(true)}
        isRefreshing={isRefreshing}
        totalReservations={reservations.length}
        currentUser={currentUser}
        onAuthChange={(user) => setCurrentUser(user)}
        onOpenGmailActivity={() => setIsGmailActivityOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Event Banner & Hero */}
        <EventHero
          onNewReservation={handleOpenNew}
          totalReservations={reservations.length}
        />

        {/* Statistics & Category Filters */}
        <StatsCards
          reservations={reservations}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Reservations Spreadsheet / Table */}
        <ReservationsTable
          reservations={reservations}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onViewTicket={(res) => setPreviewTicket(res)}
          onEditReservation={handleEdit}
          onDeleteReservation={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          onNewReservation={handleOpenNew}
          onSendEmail={(res) => setGmailSendReservation(res)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Concert "L'odyssée d'une Vie" · 17 Octobre 2026 à 15h00 · Cité des Cultures Antaninarenina
          </div>
          <div>
            Billetterie & Réservations partagées · Export Classeur Excel & Google Sheets · Gmail
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReservation}
        editingReservation={editingReservation}
        existingReservations={reservations}
      />

      <TicketPreviewModal
        reservation={previewTicket}
        onClose={() => setPreviewTicket(null)}
        onSendEmail={(res) => setGmailSendReservation(res)}
        onDeleteTicket={handleDeleteRequest}
      />

      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        reservations={reservations}
      />

      <GmailSendModal
        reservation={gmailSendReservation}
        isOpen={!!gmailSendReservation}
        onClose={() => setGmailSendReservation(null)}
        onSuccess={() => fetchReservations(false)}
      />

      <GmailActivityDrawer
        isOpen={isGmailActivityOpen}
        onClose={() => setIsGmailActivityOpen(false)}
      />

      <DeleteConfirmModal
        reservation={deletingReservation}
        isOpen={!!deletingReservation}
        onClose={() => setDeletingReservation(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
