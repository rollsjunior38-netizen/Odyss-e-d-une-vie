import { EVENT_DETAILS, Reservation } from '../types';
import { getAccessToken } from './googleAuth';
import { generateTicketPNG } from '../utils/ticketCanvas';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  to?: string;
  date?: string;
}

/**
 * Encodes string to URL-safe base64 for Gmail API
 */
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch current user's Gmail profile
 */
export async function getGmailProfile(): Promise<GmailProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération du profil Gmail (${res.status})`);
  }

  return res.json();
}

/**
 * Send an email with optional PNG ticket attachment via Gmail API
 */
export async function sendGmailMessage({
  to,
  subject,
  htmlContent,
  ticketAttachment,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  ticketAttachment?: { filename: string; base64Data: string; mimeType: string };
}): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentification Gmail requise. Veuillez vous connecter avec Google.');
  }

  let rawMessage = '';

  if (ticketAttachment) {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    // Clean base64 if it has data URL prefix
    const cleanBase64 = ticketAttachment.base64Data.replace(/^data:[^;]+;base64,/, '');

    const lines = [
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent,
      '',
      `--${boundary}`,
      `Content-Type: ${ticketAttachment.mimeType}; name="${ticketAttachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${ticketAttachment.filename}"`,
      '',
      cleanBase64,
      '',
      `--${boundary}--`,
    ];
    rawMessage = lines.join('\r\n');
  } else {
    const lines = [
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent,
    ];
    rawMessage = lines.join('\r\n');
  }

  const encoded = base64UrlEncode(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur d'envoi Gmail (${res.status})`);
  }

  return res.json();
}

/**
 * Compose & send official ticket confirmation email
 */
export async function sendReservationTicketByEmail(
  reservation: Reservation,
  recipientEmail: string,
  userCustomNote?: string
): Promise<any> {
  // Generate the PNG ticket for attachment
  let ticketPngBase64 = '';
  try {
    ticketPngBase64 = await generateTicketPNG(reservation);
  } catch (err) {
    console.warn('Could not generate ticket PNG for email attachment:', err);
  }

  const isPaid = reservation.status === 'Payé';
  const statusBadge = isPaid
    ? '<span style="display:inline-block;padding:6px 14px;background:#064e3b;color:#6ee7b7;border-radius:6px;font-weight:bold;font-size:14px;border:1px solid #059669;">✔ PAIEMENT VALIDÉ & PAYÉ</span>'
    : '<span style="display:inline-block;padding:6px 14px;background:#78350f;color:#fde68a;border-radius:6px;font-weight:bold;font-size:14px;border:1px solid #d97706;">⏳ RÉSERVÉ - EN ATTENTE DE RÈGLEMENT</span>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmation de Billet - ${EVENT_DETAILS.title}</title>
    </head>
    <body style="margin:0;padding:24px;background:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg, #1c1917 0%, #292524 100%);padding:32px 28px;text-align:center;border-bottom:2px solid #d97706;">
            <div style="font-size:12px;font-weight:700;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
              CONFIRMATION OFFICIELLE DE BILLETTERIE
            </div>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px;font-family:Georgia,serif;">
              ${EVENT_DETAILS.title}
            </h1>
            <p style="margin:8px 0 0 0;font-size:14px;color:#cbd5e1;">
              ${EVENT_DETAILS.subtitle}
            </p>
          </td>
        </tr>

        <!-- Event Details Bar -->
        <tr>
          <td style="padding:18px 28px;background:#27272a;border-bottom:1px solid #3f3f46;text-align:center;">
            <table width="100%">
              <tr>
                <td style="text-align:left;font-size:13px;color:#e4e4e7;">
                  📅 <strong>${EVENT_DETAILS.dateFormatted}</strong>
                </td>
                <td style="text-align:right;font-size:13px;color:#e4e4e7;">
                  📍 <strong>${EVENT_DETAILS.venue}</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ticket Summary Box -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px 0;font-size:15px;color:#e4e4e7;">
              Bonjour <strong>${reservation.clientName}</strong>,
            </p>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
              Votre réservation pour l'événement musical exceptionnel <strong>« ${EVENT_DETAILS.title} »</strong> est bien enregistrée. Vous trouverez ci-joint en pièce jointe votre billet officiel pré-imprimé en format PNG haute définition à présenter à l'entrée.
            </p>

            ${userCustomNote ? `
              <div style="margin:0 0 20px 0;padding:12px 16px;background:#27272a;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#fbbf24;">
                <strong>Message de l'organisation :</strong> ${userCustomNote}
              </div>
            ` : ''}

            <table width="100%" cellpadding="10" cellspacing="0" style="background:#09090b;border:1px solid #27272a;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#71717a;border-bottom:1px solid #27272a;">NUMÉRO DE BILLET</td>
                <td style="font-size:16px;font-weight:bold;color:#f59e0b;text-align:right;font-family:monospace;border-bottom:1px solid #27272a;">
                  ${reservation.ticketNumber}
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#71717a;border-bottom:1px solid #27272a;">CATÉGORIE</td>
                <td style="font-size:14px;font-weight:bold;color:#ffffff;text-align:right;border-bottom:1px solid #27272a;">
                  ${reservation.category} (${reservation.unitPrice.toLocaleString('fr-FR')} Ar / place)
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#71717a;border-bottom:1px solid #27272a;">NOMBRE DE PLACES</td>
                <td style="font-size:14px;font-weight:bold;color:#ffffff;text-align:right;border-bottom:1px solid #27272a;">
                  ${reservation.seatsCount} place${reservation.seatsCount > 1 ? 's' : ''}
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#71717a;border-bottom:1px solid #27272a;">MONTANT TOTAL</td>
                <td style="font-size:18px;font-weight:bold;color:#f59e0b;text-align:right;border-bottom:1px solid #27272a;">
                  ${reservation.totalAmount.toLocaleString('fr-FR')} Ariary
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#71717a;">STATUT RÈGLEMENT</td>
                <td style="text-align:right;">
                  ${statusBadge}
                </td>
              </tr>
            </table>

            <div style="text-align:center;padding:12px;background:#18181b;border:1px dashed #3f3f46;border-radius:8px;font-size:12px;color:#a1a1aa;">
              📎 Votre ticket PNG haute résolution est attaché à cet email. Conservez-le sur votre téléphone pour le contrôle d'accès le jour du concert.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#09090b;padding:20px 28px;text-align:center;border-top:1px solid #27272a;font-size:12px;color:#71717a;">
            Comité d'Organisation · <em>L'odyssée d'une Vie</em><br/>
            Cité des Cultures Antaninarenina · 17 Octobre 2026 à 15h00<br/>
            Émis par : ${reservation.responsibleName || 'Responsable Billetterie'}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendGmailMessage({
    to: recipientEmail,
    subject: `Votre Billet Concert « ${EVENT_DETAILS.title} » - Billet N° ${reservation.ticketNumber}`,
    htmlContent,
    ticketAttachment: ticketPngBase64
      ? {
          filename: `Billet_${reservation.ticketNumber}_${reservation.clientName.replace(/\s+/g, '_')}.png`,
          base64Data: ticketPngBase64,
          mimeType: 'image/png',
        }
      : undefined,
  });
}

/**
 * Fetch recent sent emails to track confirmations sent to attendees
 */
export async function getRecentSentConfirmations(): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent("subject:L'odyssée d'une Vie");
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) return [];

  const summaries: GmailMessageSummary[] = [];

  for (const msg of data.messages.slice(0, 5)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (msgRes.ok) {
        const fullMsg = await msgRes.json();
        const headers = fullMsg.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value;
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;

        summaries.push({
          id: fullMsg.id,
          threadId: fullMsg.threadId,
          snippet: fullMsg.snippet,
          subject,
          to,
          date,
        });
      }
    } catch (e) {
      // Continue next message
    }
  }

  return summaries;
}
