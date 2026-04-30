import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProjectReportData, ApprovedResultData } from '@/hooks/useReportData';
import { matrixLabels } from '@/constants/matrices';

// Replace unicode subscripts/superscripts with ASCII so jsPDF's built-in
// Helvetica renders cleanly (no missing glyph boxes).
const SUB_MAP: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁻':'-','₊':'+','⁺':'+','µ':'u','°':'deg ',
};
const sanitize = (s: string | null | undefined): string => {
  if (s == null) return '';
  let out = '';
  for (const ch of s) out += SUB_MAP[ch] ?? ch;
  return out;
};

export interface COAPdfOptions {
  includeMethodInfo: boolean;
  includeMDLs: boolean;
  groupByLabSection: boolean;
  organization?: {
    name: string;
    accreditation?: string | null;
    logo_url?: string | null;
  } | null;
  labSettings?: Array<{ setting_key: string; setting_value: string }> | null;
}

const COLORS = {
  primary: [15, 23, 41] as [number, number, number],   // dark navy #0f1729
  accent:  [37, 99, 235] as [number, number, number],   // blue
  light:   [241, 245, 249] as [number, number, number], // slate-100
  border:  [203, 213, 225] as [number, number, number], // slate-300
  muted:   [100, 116, 139] as [number, number, number], // slate-500
  text:    [15, 23, 41] as [number, number, number],
  white:   [255, 255, 255] as [number, number, number],
};

const getSetting = (
  settings: COAPdfOptions['labSettings'],
  key: string,
  fallback = ''
): string => settings?.find(s => s.setting_key === key)?.setting_value || fallback;

async function loadImageAsDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ data: reader.result as string, w: img.width, h: img.height });
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const formatDate = (d: string | null | undefined): string => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const formatValue = (r: ApprovedResultData): string => {
  if (r.is_below_mdl) return `<${r.mdl}`;
  return sanitize(r.entered_value || '');
};

function drawHeader(
  doc: jsPDF,
  opts: COAPdfOptions,
  logo: { data: string; w: number; h: number } | null,
  pageW: number
) {
  // Top accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 22, pageW, 1.2, 'F');

  const labName = sanitize(getSetting(opts.labSettings, 'lab_name', opts.organization?.name || 'Laboratory'));
  const accred = sanitize(opts.organization?.accreditation || getSetting(opts.labSettings, 'accreditation', ''));

  // Logo (left)
  let textX = 14;
  if (logo) {
    const targetH = 14;
    const targetW = (logo.w / logo.h) * targetH;
    try {
      doc.addImage(logo.data, 'PNG', 14, 4, targetW, targetH);
      textX = 14 + targetW + 5;
    } catch { /* ignore bad image */ }
  }

  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(labName, textX, 11);
  if (accred) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(accred, textX, 17);
  }

  // Right: COA title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CERTIFICATE OF ANALYSIS', pageW - 14, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Issued: ${formatDate(new Date().toISOString())}`, pageW - 14, 17, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, opts: COAPdfOptions) {
  const totalPages = doc.getNumberOfPages();
  const lab = sanitize(getSetting(opts.labSettings, 'lab_name', opts.organization?.name || ''));
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(`${lab} | Confidential Laboratory Report`, 14, pageH - 9);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 9, { align: 'right' });
    // small disclaimer on page 1 footer area only
    if (i === 1) {
      doc.setFontSize(7);
      doc.text(
        'This certificate shall not be reproduced except in full, without written approval from the laboratory.',
        pageW / 2, pageH - 5, { align: 'center' }
      );
    }
  }
}

function drawCoverPage(
  doc: jsPDF,
  data: ProjectReportData,
  opts: COAPdfOptions,
  pageW: number,
  pageH: number
) {
  let y = 36;

  // Project title block
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PROJECT', 14, y);

  y += 6;
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(sanitize(data.project.title), 14, y, { maxWidth: pageW - 28 });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text(`Project Code: ${sanitize(data.project.code)}`, 14, y);

  y += 10;

  // Two-column info boxes (Client | Project Info)
  const colW = (pageW - 28 - 6) / 2;
  const boxTop = y;

  const drawInfoBox = (
    title: string,
    rows: Array<[string, string]>,
    x: number,
    width: number
  ): number => {
    // header
    doc.setFillColor(...COLORS.primary);
    doc.rect(x, y, width, 7, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, x + 3, y + 5);

    let by = y + 7;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    rows.forEach(([k, v], i) => {
      const rowH = 7;
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.light);
        doc.rect(x, by, width, rowH, 'F');
      }
      doc.setTextColor(...COLORS.muted);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(k.toUpperCase(), x + 3, by + 4.7);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const val = sanitize(v) || '-';
      doc.text(val, x + width - 3, by + 4.7, { align: 'right', maxWidth: width * 0.6 });
      by += rowH;
    });
    doc.setDrawColor(...COLORS.border);
    doc.rect(x, y, width, by - y);
    return by;
  };

  const clientRows: Array<[string, string]> = [
    ['Client', data.client?.name || '-'],
    ['Contact', data.client?.contact_name || '-'],
    ['Email', data.client?.email || '-'],
    ['Address', data.client?.address || '-'],
  ];
  const projectRows: Array<[string, string]> = [
    ['Location', data.project.location || '-'],
    ['Collection', formatDate(data.project.sample_collection_date)],
    ['Receipt', formatDate(data.project.sample_receipt_date)],
    ['Analysis', `${formatDate(data.project.analysis_start_date)} - ${formatDate(data.project.analysis_end_date)}`],
    ['Program', data.project.regulatory_program || '-'],
  ];

  const leftBottom = drawInfoBox('CLIENT INFORMATION', clientRows, 14, colW);
  // reset y for second column
  y = boxTop;
  const rightBottom = drawInfoBox('PROJECT DETAILS', projectRows, 14 + colW + 6, colW);

  y = Math.max(leftBottom, rightBottom) + 12;

  // Summary stats strip
  const stats = [
    { label: 'Samples', value: String(data.summary.totalSamples) },
    { label: 'Approved Results', value: String(data.summary.approvedResults) },
    { label: 'Parameters', value: String(new Set(data.results.map(r => r.parameter_abbr)).size) },
    { label: 'Methods', value: String(new Set(data.results.map(r => r.method_code)).size) },
  ];
  const statW = (pageW - 28 - 9) / 4;
  stats.forEach((s, i) => {
    const sx = 14 + i * (statW + 3);
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(sx, y, statW, 18, 2, 2, 'FD');
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(s.label.toUpperCase(), sx + 3, y + 6);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(s.value, sx + 3, y + 14);
  });
  y += 26;

  // Sample inventory table
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Sample Inventory', 14, y);
  y += 3;

  const sampleRows = data.samples.map(s => [
    sanitize(s.sample_id),
    sanitize(s.field_id || '-'),
    matrixLabels[s.matrix] || sanitize(s.matrix),
    sanitize(s.location || '-'),
    sanitize(s.depth || '-'),
    formatDate(s.collection_date),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [['Lab ID', 'Field ID', 'Matrix', 'Location', 'Depth', 'Collected']],
    body: sampleRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary, textColor: COLORS.white,
      fontStyle: 'bold', fontSize: 8.5, halign: 'left',
    },
    bodyStyles: { fontSize: 8, textColor: COLORS.text, cellPadding: 2 },
    alternateRowStyles: { fillColor: COLORS.light },
    styles: { lineColor: COLORS.border, lineWidth: 0.2 },
    margin: { left: 14, right: 14 },
  });
}

interface ParamMeta {
  abbr: string;
  unit: string;
  mdl: number;
  loq: number;
  method: string;
  lab_section: string;
}

function buildParameterMatrix(results: ApprovedResultData[]) {
  const paramMap = new Map<string, ParamMeta>();
  for (const r of results) {
    if (!paramMap.has(r.parameter_abbr)) {
      paramMap.set(r.parameter_abbr, {
        abbr: r.parameter_abbr,
        unit: r.canonical_unit || '',
        mdl: r.mdl,
        loq: r.loq,
        method: r.method_code,
        lab_section: r.lab_section,
      });
    }
  }
  // Pivot results by sample
  const bySample = new Map<string, Map<string, ApprovedResultData>>();
  for (const r of results) {
    if (!bySample.has(r.sample_name)) bySample.set(r.sample_name, new Map());
    bySample.get(r.sample_name)!.set(r.parameter_abbr, r);
  }
  return { paramMap, bySample };
}

function drawResultsTable(
  doc: jsPDF,
  title: string,
  params: ParamMeta[],
  samples: ProjectReportData['samples'],
  bySample: Map<string, Map<string, ApprovedResultData>>,
  opts: COAPdfOptions,
  pageW: number
) {
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  // @ts-expect-error lastAutoTable typing
  let startY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 36;
  if (startY > 250) {
    doc.addPage();
    startY = 36;
  }
  doc.text(title, 14, startY);
  startY += 2;

  // Build header rows
  const head: string[][] = [
    ['Lab ID', 'Field ID', 'Matrix', ...params.map(p => sanitize(p.abbr))],
    ['', '', 'Unit', ...params.map(p => sanitize(p.unit))],
  ];
  if (opts.includeMDLs) {
    head.push(['', '', 'MDL', ...params.map(p => String(p.mdl))]);
    head.push(['', '', 'LOQ', ...params.map(p => String(p.loq))]);
  }
  if (opts.includeMethodInfo) {
    head.push(['', '', 'Method', ...params.map(p => sanitize(p.method))]);
  }

  // Body
  const sampleNames = new Set(Array.from(bySample.keys()));
  const orderedSamples = samples.filter(s => sampleNames.has(s.sample_id));
  const body = orderedSamples.map(s => {
    const row: string[] = [
      sanitize(s.sample_id),
      sanitize(s.field_id || ''),
      matrixLabels[s.matrix] || sanitize(s.matrix),
    ];
    const sampleRes = bySample.get(s.sample_id);
    for (const p of params) {
      const r = sampleRes?.get(p.abbr);
      row.push(r ? formatValue(r) : '-');
    }
    return row;
  });

  autoTable(doc, {
    startY: startY + 2,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary, textColor: COLORS.white,
      fontStyle: 'bold', fontSize: 7.5, halign: 'center', valign: 'middle',
      cellPadding: 1.6,
    },
    bodyStyles: { fontSize: 7.5, textColor: COLORS.text, cellPadding: 1.6, halign: 'center' },
    alternateRowStyles: { fillColor: COLORS.light },
    styles: { lineColor: COLORS.border, lineWidth: 0.15, overflow: 'linebreak' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
      1: { halign: 'left', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 22 },
    },
    margin: { left: 8, right: 8 },
    didParseCell: (cellData) => {
      // Style metadata rows (rows 1..N of head) differently
      if (cellData.section === 'head' && cellData.row.index > 0) {
        cellData.cell.styles.fillColor = COLORS.light as unknown as string;
        cellData.cell.styles.textColor = COLORS.muted as unknown as string;
        cellData.cell.styles.fontStyle = 'normal';
        cellData.cell.styles.fontSize = 7;
      }
      // Highlight below-MDL values
      if (cellData.section === 'body' && typeof cellData.cell.raw === 'string' && cellData.cell.raw.startsWith('<')) {
        cellData.cell.styles.textColor = COLORS.muted as unknown as string;
        cellData.cell.styles.fontStyle = 'italic';
      }
    },
  });
}

function drawSignatureBlock(doc: jsPDF, pageW: number, opts: COAPdfOptions) {
  // @ts-expect-error lastAutoTable typing
  let y = (doc as any).lastAutoTable?.finalY ?? 100;
  y += 14;
  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - 60) {
    doc.addPage();
    y = 40;
  }
  const labMgr = sanitize(getSetting(opts.labSettings, 'lab_manager_name', 'Laboratory Manager'));
  const qaOfficer = sanitize(getSetting(opts.labSettings, 'qa_officer_name', 'Quality Assurance Officer'));

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Authorisation', 14, y);
  y += 6;

  const colW = (pageW - 28 - 8) / 2;
  const drawSig = (x: number, name: string, role: string) => {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(x, y + 18, x + colW, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(name, x, y + 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(role, x, y + 28);
    doc.text(`Date: ${formatDate(new Date().toISOString())}`, x, y + 33);
  };
  drawSig(14, labMgr, 'Laboratory Manager');
  drawSig(14 + colW + 8, qaOfficer, 'Quality Assurance Officer');

  // Notes / legend
  y += 42;
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text('NOTES', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    'MDL: Method Detection Limit. LOQ: Limit of Quantification. Values reported as <MDL indicate the analyte was not',
    18, y + 11
  );
  doc.text(
    'detected at or above the stated detection limit. Results apply only to the samples as received and tested.',
    18, y + 15
  );
  doc.text(
    'Uncertainty of measurement is available on request.',
    18, y + 19
  );
}

export async function buildCOAPdf(
  data: ProjectReportData,
  opts: COAPdfOptions
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Logo
  let logo: { data: string; w: number; h: number } | null = null;
  if (opts.organization?.logo_url) {
    logo = await loadImageAsDataUrl(opts.organization.logo_url);
  }

  // Page 1: Cover
  drawHeader(doc, opts, logo, pageW);
  drawCoverPage(doc, data, opts, pageW, pageH);

  // Results pages
  doc.addPage();
  drawHeader(doc, opts, logo, pageW);

  const { paramMap, bySample } = buildParameterMatrix(data.results);

  if (opts.groupByLabSection) {
    // Group by lab_section
    const sections = new Map<string, ParamMeta[]>();
    for (const meta of paramMap.values()) {
      const key = meta.lab_section || 'General';
      if (!sections.has(key)) sections.set(key, []);
      sections.get(key)!.push(meta);
    }
    const sortedSections = Array.from(sections.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let first = true;
    for (const [section, params] of sortedSections) {
      if (params.length === 0) continue;
      // Filter bySample to just these params (table already does this naturally)
      const title = `Analytical Results: ${section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
      // chunk wide tables: max 10 params per table
      const chunks: ParamMeta[][] = [];
      for (let i = 0; i < params.length; i += 10) chunks.push(params.slice(i, i + 10));
      chunks.forEach((chunk, idx) => {
        const t = chunks.length > 1 ? `${title} (Part ${idx + 1} of ${chunks.length})` : title;
        if (!first) {
          // small spacing handled in drawResultsTable via lastAutoTable
        }
        drawResultsTable(doc, t, chunk, data.samples, bySample, opts, pageW);
        first = false;
      });
    }
  } else {
    const allParams = Array.from(paramMap.values()).sort((a, b) => a.abbr.localeCompare(b.abbr));
    const chunks: ParamMeta[][] = [];
    for (let i = 0; i < allParams.length; i += 10) chunks.push(allParams.slice(i, i + 10));
    chunks.forEach((chunk, idx) => {
      const t = chunks.length > 1
        ? `Analytical Results (Part ${idx + 1} of ${chunks.length})`
        : 'Analytical Results';
      drawResultsTable(doc, t, chunk, data.samples, bySample, opts, pageW);
    });
  }

  // Signature & notes
  drawSignatureBlock(doc, pageW, opts);

  // Re-draw header on every page beyond first to ensure consistency
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    drawHeader(doc, opts, logo, pageW);
  }

  // Footer (with page numbers)
  drawFooter(doc, pageW, pageH, opts);

  return doc;
}

export function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName);
}
