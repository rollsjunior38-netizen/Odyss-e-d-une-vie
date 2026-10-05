import QRCode from 'qrcode';
import { CATEGORY_DETAILS, EVENT_DETAILS, Reservation } from '../types';

export async function generateTicketPNG(reservation: Reservation): Promise<string> {
  const canvas = document.createElement('canvas');
  // High resolution: 1400 x 600 px for ultra sharp 300dpi printing
  const width = 1400;
  const height = 600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d\'obtenir le contexte 2D du canvas');

  const catMeta = CATEGORY_DETAILS[reservation.category] || CATEGORY_DETAILS.Classic;
  const isGold = reservation.category === 'Gold';
  const isSilver = reservation.category === 'Silver';
  const isClassic = reservation.category === 'Classic';

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isGold) {
    bgGrad.addColorStop(0, '#0c0a06');
    bgGrad.addColorStop(0.35, '#17130a');
    bgGrad.addColorStop(0.7, '#1f1a0e');
    bgGrad.addColorStop(1, '#0e0b06');
  } else if (isSilver) {
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.4, '#131b2c');
    bgGrad.addColorStop(0.8, '#1b2438');
    bgGrad.addColorStop(1, '#0e1422');
  } else {
    // Classic: deep navy / sapphire emerald
    bgGrad.addColorStop(0, '#060f1b');
    bgGrad.addColorStop(0.4, '#0a1a2e');
    bgGrad.addColorStop(0.8, '#0d223a');
    bgGrad.addColorStop(1, '#071220');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle metallic texture lines
  ctx.save();
  ctx.strokeStyle = isGold
    ? 'rgba(212, 175, 55, 0.04)'
    : isSilver
    ? 'rgba(203, 213, 225, 0.04)'
    : 'rgba(56, 189, 248, 0.04)';
  ctx.lineWidth = 1;
  for (let x = -height; x < width + height; x += 35) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Borders & Ornamental Framing
  const accentColor = isGold ? '#d4af37' : isSilver ? '#cbd5e1' : '#38bdf8';
  const accentMuted = isGold ? '#927228' : isSilver ? '#64748b' : '#0284c7';

  // Outer border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner hairline border
  ctx.strokeStyle = accentMuted;
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Corner flourishes
  const cornerSize = 25;
  const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerSize);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerSize, cy);
    ctx.stroke();
    ctx.restore();
  };
  drawCorner(24, 24, 1, 1);
  drawCorner(width - 24, 24, -1, 1);
  drawCorner(24, height - 24, 1, -1);
  drawCorner(width - 24, height - 24, -1, -1);

  // 3. Perforation Line (Stub Separator)
  const stubX = width - 360;
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = accentMuted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stubX, 20);
  ctx.lineTo(stubX, height - 20);
  ctx.stroke();
  ctx.restore();

  // Cutout notches at top and bottom of perforation
  const notchRadius = 18;
  ctx.save();
  ctx.fillStyle = '#0a0a0a'; // matches background surround
  ctx.beginPath();
  ctx.arc(stubX, 20, notchRadius, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(stubX, height - 20, notchRadius, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(stubX, 20, notchRadius, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(stubX, height - 20, notchRadius, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // MAIN TICKET BODY (Left Section: X: 45 to stubX - 30)
  // ----------------------------------------------------
  const mainLeft = 55;

  // Category Banner Top Left
  ctx.save();
  ctx.fillStyle = isGold ? '#d4af37' : isSilver ? '#e2e8f0' : '#38bdf8';
  ctx.fillRect(mainLeft, 45, 170, 26);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px "Cinzel", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.textAlign = 'center';
  ctx.fillText(`BILLET ${reservation.category.toUpperCase()}`, mainLeft + 85, 63);
  ctx.restore();

  // Ticket Number beside Category
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`N° : ${reservation.ticketNumber}`, mainLeft + 195, 63);

  // Event Main Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Cinzel", Georgia, serif';
  ctx.fillText("L'ODYSSÉE D'UNE VIE", mainLeft, 125);

  // Event Subtitle & Metadata
  ctx.fillStyle = accentColor;
  ctx.font = '600 15px "Cinzel", Georgia, serif';
  ctx.fillText('CONCERT ÉVÉNEMENT MUSICAL', mainLeft, 155);

  // Date, Time, Venue Pills / Text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`📅 ${EVENT_DETAILS.dateFormatted}`, mainLeft, 190);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`📍 ${EVENT_DETAILS.venue} • Antananarivo`, mainLeft, 218);

  // Horizontal separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mainLeft, 238);
  ctx.lineTo(stubX - 45, 238);
  ctx.stroke();

  // Client Info Section
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TITULAIRE DU BILLET', mainLeft, 266);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Cinzel", Georgia, serif';
  const displayClient = reservation.clientName.length > 32
    ? reservation.clientName.substring(0, 30) + '...'
    : reservation.clientName;
  ctx.fillText(displayClient, mainLeft, 298);

  if (reservation.clientPhone) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText(`Tél : ${reservation.clientPhone}`, mainLeft, 324);
  }

  // Specs Grid (Category, Price, Seats, Total)
  const gridY = 360;
  const colW = (stubX - 90 - mainLeft) / 4;

  const drawSpec = (label: string, value: string, sub: string, colIdx: number, isHighlighted = false) => {
    const cx = mainLeft + colIdx * colW;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, cx, gridY);

    ctx.fillStyle = isHighlighted ? accentColor : '#ffffff';
    ctx.font = isHighlighted ? 'bold 20px "Cinzel", Georgia, serif' : 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(value, cx, gridY + 26);

    if (sub) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(sub, cx, gridY + 44);
    }
  };

  drawSpec('CATÉGORIE', reservation.category, catMeta.description, 0);
  drawSpec('TARIF UNITAIRE', `${reservation.unitPrice.toLocaleString('fr-FR')} Ar`, 'Prix par billet', 1);
  drawSpec('PLACES', `${reservation.seatsCount} Place${reservation.seatsCount > 1 ? 's' : ''}`, 'Réservation', 2);
  drawSpec('TOTAL RÈGLEMENT', `${reservation.totalAmount.toLocaleString('fr-FR')} Ar`, reservation.status, 3, true);

  // Bottom Footer / Barcode & Issuance
  const footerY = 475;

  // Fake Code 128 Barcode
  ctx.save();
  const bcX = mainLeft;
  const bcY = footerY;
  const bcW = 260;
  const bcH = 45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bcX, bcY, bcW, bcH);

  ctx.fillStyle = '#000000';
  // Generate deterministic bar pattern from ticketNumber
  let seed = 0;
  for (let i = 0; i < reservation.ticketNumber.length; i++) {
    seed += reservation.ticketNumber.charCodeAt(i);
  }
  let currentBx = bcX + 10;
  while (currentBx < bcX + bcW - 15) {
    const barWidth = ((seed * (currentBx - bcX)) % 4) + 1;
    const gap = (((seed + 7) * currentBx) % 3) + 1;
    ctx.fillRect(currentBx, bcY + 4, barWidth, bcH - 16);
    currentBx += barWidth + gap;
  }
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(reservation.ticketNumber, bcX + bcW / 2, bcY + bcH - 2);
  ctx.restore();

  // Issuance Info beside Barcode
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  const issueDate = new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillText(`Émis le : ${issueDate}`, mainLeft + 280, footerY + 18);
  ctx.fillText(`Responsable : ${reservation.responsibleName || 'Comité d\'Organisation'}`, mainLeft + 280, footerY + 36);
  ctx.fillText(`Mode : ${reservation.paymentMethod || 'Espèces'}`, mainLeft + 280, footerY + 54);

  // Status Stamp (Circular luxury stamp)
  const isPaid = reservation.status === 'Payé';
  const stampX = stubX - 120;
  const stampY = 160;

  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate((-12 * Math.PI) / 180);

  const stampColor = isPaid
    ? isGold
      ? '#f59e0b'
      : '#10b981'
    : '#f43f5e';

  // Double circle stamp
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = stampColor;
  ctx.textAlign = 'center';

  if (isPaid) {
    ctx.font = 'bold 12px "Cinzel", Georgia, serif';
    ctx.fillText('★ CONCERT OFFICIEL ★', 0, -32);

    ctx.font = '900 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PAYÉ', 0, -4);

    ctx.font = 'bold 11px "Cinzel", Georgia, serif';
    ctx.fillText('VALIDÉ & ENREGISTRÉ', 0, 18);

    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.fillText('CITÉ DES CULTURES', 0, 36);
  } else {
    ctx.font = 'bold 11px "Cinzel", Georgia, serif';
    ctx.fillText('★ ENREGISTRÉ ★', 0, -32);

    ctx.font = '900 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NON PAYÉ', 0, -4);

    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EN ATTENTE RÈGLEMENT', 0, 18);

    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.fillText('RÉSERVÉ', 0, 36);
  }
  ctx.restore();

  // ----------------------------------------------------
  // RIGHT SECTION: TEAR-OFF STUB (Talon détachable)
  // ----------------------------------------------------
  const stubLeft = stubX + 30;
  const stubContentWidth = width - 40 - stubLeft;

  // Stub Header
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 12px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOUCHE DE CONTRÔLE', stubLeft + stubContentWidth / 2, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Cinzel", Georgia, serif';
  ctx.fillText("L'ODYSSÉE D'UNE VIE", stubLeft + stubContentWidth / 2, 85);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('17 OCT. 2026 • 15H00', stubLeft + stubContentWidth / 2, 105);

  // QR Code Generation
  const qrData = JSON.stringify({
    event: "L'odyssée d'une Vie",
    ticket: reservation.ticketNumber,
    name: reservation.clientName,
    cat: reservation.category,
    seats: reservation.seatsCount,
    status: reservation.status,
    id: reservation.id,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 170,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });

    // Draw white container for QR code
    const qrX = stubLeft + (stubContentWidth - 170) / 2;
    const qrY = 135;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 6, qrY - 6, 182, 182);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 6, qrY - 6, 182, 182);

    ctx.drawImage(qrImg, qrX, qrY, 170, 170);
  } catch (err) {
    console.error('QR code generation error:', err);
  }

  // Stub Ticket Details
  const stubDetailsY = 350;
  ctx.textAlign = 'center';

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(reservation.ticketNumber, stubLeft + stubContentWidth / 2, stubDetailsY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  const stubClient = reservation.clientName.length > 22
    ? reservation.clientName.substring(0, 20) + '...'
    : reservation.clientName;
  ctx.fillText(stubClient, stubLeft + stubContentWidth / 2, stubDetailsY + 26);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 14px "Cinzel", Georgia, serif';
  ctx.fillText(
    `${reservation.category.toUpperCase()} • ${reservation.seatsCount} PL.`,
    stubLeft + stubContentWidth / 2,
    stubDetailsY + 50
  );

  ctx.fillStyle = isPaid ? '#10b981' : '#f59e0b';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isPaid ? '✔ ENTRÉE VALIDE' : '⏳ RÈGLEMENT À L\'ENTRÉE',
    stubLeft + stubContentWidth / 2,
    stubDetailsY + 74
  );

  // Perforation instruction
  ctx.fillStyle = '#64748b';
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('À DÉTACHER PAR LE CONTRÔLEUR', stubLeft + stubContentWidth / 2, height - 42);
  ctx.fillText('CITÉ DES CULTURES ANTANINARENINA', stubLeft + stubContentWidth / 2, height - 28);

  return canvas.toDataURL('image/png');
}

export async function downloadTicketPNG(reservation: Reservation) {
  const dataUrl = await generateTicketPNG(reservation);
  const cleanName = reservation.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Ticket_${reservation.ticketNumber}_${cleanName}_${reservation.category}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
