import * as XLSX from 'xlsx';
import { Reservation } from '../types';

export function exportReservationsToExcel(reservations: Reservation[], filenamePrefix = 'Reservations_L_Odyssee_D_une_Vie') {
  // Prepare data rows
  const rows = reservations.map((res, index) => {
    return {
      'N°': index + 1,
      'Numéro de Billet': res.ticketNumber,
      'Nom du Client': res.clientName,
      'Téléphone': res.clientPhone || '—',
      'Email Client': res.clientEmail || '—',
      'Catégorie': res.category,
      'Tarif Unitaire (Ariary)': res.unitPrice,
      'Nombre de Places': res.seatsCount,
      'Montant Total (Ariary)': res.totalAmount,
      'Statut': res.status,
      'Mode de Paiement': res.paymentMethod || '—',
      'Responsable / Émetteur': res.responsibleName || '—',
      'Remarques / Notes': res.notes || '',
      'Date d\'enregistrement': new Date(res.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });

  // Calculate summary stats
  const totalPlaces = reservations.reduce((sum, r) => sum + r.seatsCount, 0);
  const totalAmount = reservations.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = reservations
    .filter((r) => r.status === 'Payé')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPending = reservations
    .filter((r) => r.status === 'Non Payé')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  // Add summary rows at bottom
  const summaryRows = [
    {}, // empty row
    {
      'N°': '',
      'Numéro de Billet': 'RÉCAPITULATIF GLOBAL',
      'Nom du Client': `Total Réservations : ${reservations.length}`,
      'Téléphone': '',
      'Email Client': '',
      'Catégorie': '',
      'Tarif Unitaire (Ariary)': '',
      'Nombre de Places': totalPlaces,
      'Montant Total (Ariary)': totalAmount,
      'Statut': `Encaissé : ${totalPaid.toLocaleString()} Ar`,
      'Mode de Paiement': `En attente : ${totalPending.toLocaleString()} Ar`,
      'Responsable / Émetteur': 'Événement: L\'odyssée d\'une Vie',
      'Remarques / Notes': '17 Octobre 2026 à Cité des Cultures',
      'Date d\'enregistrement': '',
    },
  ];

  const fullSheetData = [...rows, ...summaryRows];
  const worksheet = XLSX.utils.json_to_sheet(fullSheetData);

  // Set column widths for readability on mobile / desktop Excel
  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 18 }, // Numéro de Billet
    { wch: 25 }, // Nom du Client
    { wch: 16 }, // Téléphone
    { wch: 24 }, // Email Client
    { wch: 12 }, // Catégorie
    { wch: 16 }, // Tarif Unitaire
    { wch: 14 }, // Places
    { wch: 18 }, // Total Ar
    { wch: 14 }, // Statut
    { wch: 18 }, // Mode
    { wch: 20 }, // Responsable
    { wch: 30 }, // Notes
    { wch: 22 }, // Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Réservations Concert');

  // Metadata properties
  workbook.Props = {
    Title: "Réservations - L'odyssée d'une Vie",
    Subject: "Billetterie & Réservations Cité des Cultures",
    Author: "Comité d'Organisation",
    CreatedDate: new Date(),
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export function copyReservationsForGoogleSheets(reservations: Reservation[]): string {
  const headers = [
    'N° Billet',
    'Nom du Client',
    'Téléphone',
    'Email',
    'Catégorie',
    'Prix Unitaire (Ar)',
    'Places',
    'Total (Ar)',
    'Statut',
    'Mode de Paiement',
    'Responsable',
    'Notes',
    'Date Enregistrement',
  ];

  const rows = reservations.map((r) => [
    r.ticketNumber,
    r.clientName,
    r.clientPhone || '',
    r.clientEmail || '',
    r.category,
    r.unitPrice,
    r.seatsCount,
    r.totalAmount,
    r.status,
    r.paymentMethod || '',
    r.responsibleName || '',
    r.notes || '',
    new Date(r.createdAt).toLocaleDateString('fr-FR'),
  ]);

  const allLines = [headers.join('\t'), ...rows.map((row) => row.join('\t'))];
  return allLines.join('\n');
}

export function downloadReservationsCSV(reservations: Reservation[], filenamePrefix = 'Reservations_L_Odyssee') {
  const headers = [
    'Billet',
    'Client',
    'Telephone',
    'Email',
    'Categorie',
    'Prix_Unitaire_Ar',
    'Places',
    'Total_Ar',
    'Statut',
    'Mode_Paiement',
    'Responsable',
    'Notes',
    'Date',
  ];

  const csvContent = [
    headers.join(';'),
    ...reservations.map((r) => [
      `"${r.ticketNumber}"`,
      `"${r.clientName.replace(/"/g, '""')}"`,
      `"${(r.clientPhone || '').replace(/"/g, '""')}"`,
      `"${(r.clientEmail || '').replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.unitPrice,
      r.seatsCount,
      r.totalAmount,
      `"${r.status}"`,
      `"${(r.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(r.responsibleName || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(r.createdAt).toLocaleDateString('fr-FR')}"`,
    ].join(';')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
