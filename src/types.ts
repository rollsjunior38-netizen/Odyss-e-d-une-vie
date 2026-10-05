export type TicketCategory = 'Classic' | 'Silver' | 'Gold';
export type PaymentStatus = 'Payé' | 'Non Payé';
export type PaymentMethod = 'Espèces' | 'Mvola' | 'Orange Money' | 'Airtel Money' | 'Virement / Chèque' | 'En attente';

export interface Reservation {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  category: TicketCategory;
  unitPrice: number;
  seatsCount: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  responsibleName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_PRICES: Record<TicketCategory, number> = {
  Classic: 25000,
  Silver: 50000,
  Gold: 100000,
};

export const CATEGORY_DETAILS: Record<TicketCategory, {
  name: string;
  price: number;
  badgeColor: string;
  accentColor: string;
  description: string;
  prefix: string;
}> = {
  Classic: {
    name: 'Classic',
    price: 25000,
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    accentColor: '#10b981',
    description: 'Accès Standard Hall Principal',
    prefix: 'ODYS-CLS',
  },
  Silver: {
    name: 'Silver',
    price: 50000,
    badgeColor: 'text-slate-200 bg-slate-800/80 border-slate-600/60',
    accentColor: '#94a3b8',
    description: 'Placement Privilège Vue Centrale',
    prefix: 'ODYS-SLV',
  },
  Gold: {
    name: 'Gold',
    price: 100000,
    badgeColor: 'text-amber-300 bg-amber-950/70 border-amber-600/70',
    accentColor: '#f59e0b',
    description: 'Carré VIP Or avec Accueil Dédié',
    prefix: 'ODYS-GLD',
  },
};

export const CATEGORY_LIMITS: Record<TicketCategory, {
  min: number;
  max: number;
  total: number;
  rangeLabel: string;
  prefix: string;
}> = {
  Gold: {
    min: 1,
    max: 59,
    total: 59,
    rangeLabel: '001 - 059',
    prefix: 'ODYS-GLD',
  },
  Silver: {
    min: 100,
    max: 200,
    total: 101,
    rangeLabel: '100 - 200',
    prefix: 'ODYS-SLV',
  },
  Classic: {
    min: 300,
    max: 400,
    total: 101,
    rangeLabel: '300 - 400',
    prefix: 'ODYS-CLS',
  },
};

/**
 * Extracts integer number from a ticket string (e.g. "ODYS-GLD-042" -> 42, "007" -> 7, "150" -> 150)
 */
export function extractTicketNumericValue(ticketStr: string): number | null {
  if (!ticketStr) return null;
  const match = ticketStr.match(/(\d+)/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format a number to standard ticket code (e.g. Gold 7 -> "ODYS-GLD-007", Silver 105 -> "ODYS-SLV-105")
 */
export function formatTicketCode(category: TicketCategory, num: number): string {
  const limit = CATEGORY_LIMITS[category];
  const padded = String(num).padStart(3, '0');
  return `${limit.prefix}-${padded}`;
}

/**
 * Find next available number in the category range that is not already taken
 */
export function getNextAvailableTicket(
  category: TicketCategory,
  reservations: Reservation[],
  currentId?: string
): string | null {
  const limit = CATEGORY_LIMITS[category];
  const usedNumbers = new Set<number>();

  for (const r of reservations) {
    if (currentId && r.id === currentId) continue;
    if (r.category === category) {
      const num = extractTicketNumericValue(r.ticketNumber);
      if (num !== null) usedNumbers.add(num);
    }
  }

  for (let n = limit.min; n <= limit.max; n++) {
    if (!usedNumbers.has(n)) {
      return formatTicketCode(category, n);
    }
  }

  return null; // Quota full!
}

/**
 * Validate that a ticket number strictly adheres to category boundary [min, max] and is unique
 */
export function validateTicketAssignment(
  category: TicketCategory,
  ticketStr: string,
  reservations: Reservation[],
  currentId?: string
): { valid: boolean; error?: string; normalized?: string } {
  const num = extractTicketNumericValue(ticketStr);
  const limit = CATEGORY_LIMITS[category];

  if (num === null) {
    return {
      valid: false,
      error: `Numéro de billet invalide. Pour ${category}, il doit être compris entre ${limit.rangeLabel}.`,
    };
  }

  if (num < limit.min || num > limit.max) {
    return {
      valid: false,
      error: `Dépassement de limite : Les billets ${category} sont strictement limités de ${limit.rangeLabel}. (${num} hors limites)`,
    };
  }

  // Check uniqueness
  const conflict = reservations.find(
    (r) =>
      r.id !== currentId &&
      r.category === category &&
      extractTicketNumericValue(r.ticketNumber) === num
  );

  if (conflict) {
    return {
      valid: false,
      error: `Le numéro ${String(num).padStart(3, '0')} (${conflict.ticketNumber}) est déjà attribué à ${conflict.clientName}.`,
    };
  }

  const normalized = formatTicketCode(category, num);
  return { valid: true, normalized };
}


export const EVENT_DETAILS = {
  title: "L'odyssée d'une Vie",
  subtitle: "Concert Événement Musical",
  dateFormatted: "Samedi 17 Octobre 2026 à 15h00",
  time: "15:00",
  venue: "Cité des Cultures Antaninarenina",
  city: "Antananarivo, Madagascar",
};
