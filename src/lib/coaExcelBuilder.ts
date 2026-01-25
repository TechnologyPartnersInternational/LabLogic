import ExcelJS from 'exceljs';
import { ProjectReportData } from '@/hooks/useReportData';
import tpiLogoUrl from '@/assets/tpi-logo.png';

interface SampleInfo {
  id: string;
  sample_id: string;
  field_id: string | null;
  matrix: string;
}

interface ResultInfo {
  sample_id: string;
  sample_name: string;
  field_id: string | null;
  matrix: string;
  parameter_abbr: string;
  entered_value: string | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  mdl: number;
  loq: number;
  method_code: string;
  lab_section: string;
}

// Color palette
const COLORS = {
  darkBlue: '1a365d',
  mediumBlue: '2c5282',
  lightBlue: 'e2e8f0',
  veryLightBlue: 'f7fafc',
  white: 'ffffff',
  black: '000000',
  gray: '718096',
  lightGray: 'edf2f7',
  gold: 'd69e2e',
};

// Border styles
const thickBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: COLORS.darkBlue } };
const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: COLORS.gray } };

export async function buildCOAWorkbook(
  reportData: ProjectReportData,
  options: {
    includeMethodInfo: boolean;
    includeMDLs: boolean;
    groupByLabSection: boolean;
  }
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TPI Laboratory - LabFlow';
  workbook.created = new Date();

  // Create Cover Sheet
  await createCoverSheet(workbook, reportData);

  // Create Results Sheets
  if (options.groupByLabSection) {
    const resultsBySection = new Map<string, typeof reportData.results>();
    for (const result of reportData.results) {
      const section = result.lab_section || 'Other';
      if (!resultsBySection.has(section)) {
        resultsBySection.set(section, []);
      }
      resultsBySection.get(section)!.push(result);
    }

    for (const [section, sectionResults] of resultsBySection) {
      const sectionName = section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const tabName = `${sectionName} - ${reportData.project.title}`.substring(0, 31);
      createResultsSheet(
        workbook,
        tabName,
        sectionName,
        reportData.project.title,
        sectionResults as ResultInfo[],
        reportData.samples,
        options
      );
    }
  } else {
    createResultsSheet(
      workbook,
      `Results - ${reportData.project.title}`.substring(0, 31),
      'All Results',
      reportData.project.title,
      reportData.results as ResultInfo[],
      reportData.samples,
      options
    );
  }

  return workbook;
}

async function createCoverSheet(workbook: ExcelJS.Workbook, reportData: ProjectReportData) {
  const sheet = workbook.addWorksheet('Cover Page', {
    properties: { tabColor: { argb: COLORS.darkBlue } },
  });

  // Set column widths
  sheet.columns = [
    { width: 30 },
    { width: 50 },
  ];

  // Add logo - fetch and embed
  try {
    const response = await fetch(tpiLogoUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const imageId = workbook.addImage({
      base64,
      extension: 'png',
    });

    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 60 },
    });
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // Starting row after logo
  let row = 5;

  // Company Header
  const companyRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  companyRow.getCell(1).value = 'TECHNOLOGY PARTNERS INTERNATIONAL';
  companyRow.getCell(1).font = { bold: true, size: 18, color: { argb: COLORS.darkBlue } };
  companyRow.getCell(1).alignment = { horizontal: 'center' };
  companyRow.height = 28;
  row++;

  const taglineRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  taglineRow.getCell(1).value = 'Environmental Laboratory Services';
  taglineRow.getCell(1).font = { italic: true, size: 12, color: { argb: COLORS.gray } };
  taglineRow.getCell(1).alignment = { horizontal: 'center' };
  row += 2;

  // Divider
  const divider1 = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  divider1.getCell(1).border = { bottom: thickBorder };
  row += 2;

  // COA Title
  const titleRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  titleRow.getCell(1).value = 'CERTIFICATE OF ANALYSIS';
  titleRow.getCell(1).font = { bold: true, size: 22, color: { argb: COLORS.darkBlue } };
  titleRow.getCell(1).alignment = { horizontal: 'center' };
  titleRow.height = 35;
  row++;

  // Project title subtitle
  const subtitleRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  subtitleRow.getCell(1).value = reportData.project.title;
  subtitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.mediumBlue } };
  subtitleRow.getCell(1).alignment = { horizontal: 'center' };
  row += 2;

  // Divider
  const divider2 = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  divider2.getCell(1).border = { bottom: thickBorder };
  row += 2;

  // Section helper
  const addSection = (title: string, data: [string, string | number | null][]) => {
    const headerRow = sheet.getRow(row);
    sheet.mergeCells(`A${row}:B${row}`);
    headerRow.getCell(1).value = title;
    headerRow.getCell(1).font = { bold: true, size: 13, color: { argb: COLORS.white } };
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkBlue } };
    headerRow.getCell(1).alignment = { horizontal: 'left', indent: 1 };
    headerRow.height = 24;
    row++;

    data.forEach(([label, value], idx) => {
      const dataRow = sheet.getRow(row);
      dataRow.getCell(1).value = label;
      dataRow.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.darkBlue } };
      dataRow.getCell(2).value = value || 'N/A';
      dataRow.getCell(2).font = { size: 11 };
      
      // Alternating row colors
      const bgColor = idx % 2 === 0 ? COLORS.veryLightBlue : COLORS.white;
      dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      dataRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      
      // Borders
      dataRow.getCell(1).border = { left: thinBorder, right: thinBorder, bottom: thinBorder };
      dataRow.getCell(2).border = { right: thinBorder, bottom: thinBorder };
      
      row++;
    });
    row++;
  };

  // Project Information
  addSection('PROJECT INFORMATION', [
    ['Project Code:', reportData.project.code],
    ['Project Title:', reportData.project.title],
    ['Location:', reportData.project.location],
    ['Regulatory Program:', reportData.project.regulatory_program],
  ]);

  // Client Information
  addSection('CLIENT INFORMATION', [
    ['Client Name:', reportData.client?.name],
    ['Address:', reportData.client?.address],
    ['Contact Person:', reportData.client?.contact_name],
    ['Email:', reportData.client?.email],
  ]);

  // Analysis Summary
  addSection('ANALYSIS SUMMARY', [
    ['Sample Collection Date:', reportData.project.sample_collection_date],
    ['Sample Receipt Date:', reportData.project.sample_receipt_date],
    ['Analysis Start Date:', reportData.project.analysis_start_date],
    ['Analysis End Date:', reportData.project.analysis_end_date],
    ['Report Issue Date:', new Date().toLocaleDateString()],
    ['Total Samples Analyzed:', reportData.summary.totalSamples],
    ['Total Parameters Reported:', reportData.summary.approvedResults],
  ]);

  row++;

  // Footer divider
  const footerDivider = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  footerDivider.getCell(1).border = { bottom: thickBorder };
  row += 2;

  // Disclaimer
  const disc1 = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  disc1.getCell(1).value = 'This report shall not be reproduced except in full,';
  disc1.getCell(1).font = { italic: true, size: 10, color: { argb: COLORS.gray } };
  disc1.getCell(1).alignment = { horizontal: 'center' };
  row++;

  const disc2 = sheet.getRow(row);
  sheet.mergeCells(`A${row}:B${row}`);
  disc2.getCell(1).value = 'without written approval from TPI Laboratory.';
  disc2.getCell(1).font = { italic: true, size: 10, color: { argb: COLORS.gray } };
  disc2.getCell(1).alignment = { horizontal: 'center' };
}

function createResultsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  sectionName: string,
  projectTitle: string,
  results: ResultInfo[],
  samples: SampleInfo[],
  options: { includeMethodInfo: boolean; includeMDLs: boolean }
) {
  const sheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: COLORS.mediumBlue } },
  });

  // Get unique parameters
  const parameterSet = new Map<string, { unit: string; mdl: number; loq: number; method: string }>();
  for (const r of results) {
    if (!parameterSet.has(r.parameter_abbr)) {
      parameterSet.set(r.parameter_abbr, {
        unit: r.canonical_unit || '',
        mdl: r.mdl,
        loq: r.loq,
        method: r.method_code,
      });
    }
  }
  const parameters = Array.from(parameterSet.keys());
  const paramMetadata = Array.from(parameterSet.values());

  // Get samples with results
  const sampleIdsWithResults = new Set(results.map(r => r.sample_name));
  const orderedSamples = samples.filter(s => sampleIdsWithResults.has(s.sample_id));

  // Build result lookup
  const resultMap = new Map<string, Map<string, ResultInfo>>();
  for (const r of results) {
    if (!resultMap.has(r.sample_name)) {
      resultMap.set(r.sample_name, new Map());
    }
    resultMap.get(r.sample_name)!.set(r.parameter_abbr, r);
  }

  const fixedCols = 3;
  const totalCols = fixedCols + parameters.length;
  let row = 1;

  // Title row
  sheet.mergeCells(row, 1, row, totalCols);
  const titleCell = sheet.getCell(row, 1);
  titleCell.value = `${sectionName} Results for ${projectTitle}`;
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.darkBlue } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.border = { bottom: thickBorder };
  sheet.getRow(row).height = 28;
  row += 2;

  // Header row (parameters)
  const headerRowNum = row;
  const headers = ['Sample ID', 'Field ID', 'Matrix', ...parameters];
  headers.forEach((header, colIdx) => {
    const cell = sheet.getCell(row, colIdx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkBlue } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: thickBorder,
      bottom: thickBorder,
      left: colIdx === 0 ? thickBorder : thinBorder,
      right: colIdx === headers.length - 1 ? thickBorder : thinBorder,
    };
  });
  sheet.getRow(row).height = 22;
  row++;

  // Units row - styled prominently
  const unitsData = ['', '', 'Unit:', ...paramMetadata.map(p => p.unit || 'N/A')];
  unitsData.forEach((val, colIdx) => {
    const cell = sheet.getCell(row, colIdx + 1);
    cell.value = val;
    cell.font = { bold: colIdx >= 3, size: 10, color: { argb: colIdx >= 3 ? COLORS.mediumBlue : COLORS.gray } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { 
      left: colIdx === 0 ? thickBorder : thinBorder, 
      right: colIdx === unitsData.length - 1 ? thickBorder : thinBorder, 
      bottom: thinBorder 
    };
  });
  sheet.getRow(row).height = 18;
  row++;

  // MDL/LOQ rows
  if (options.includeMDLs) {
    const mdlData = ['', '', 'MDL:', ...paramMetadata.map(p => p.mdl.toString())];
    mdlData.forEach((val, colIdx) => {
      const cell = sheet.getCell(row, colIdx + 1);
      cell.value = val;
      cell.font = { italic: true, size: 10, color: { argb: COLORS.gray } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
      cell.border = { left: thinBorder, right: thinBorder, bottom: thinBorder };
    });
    row++;

    const loqData = ['', '', 'LOQ:', ...paramMetadata.map(p => p.loq.toString())];
    loqData.forEach((val, colIdx) => {
      const cell = sheet.getCell(row, colIdx + 1);
      cell.value = val;
      cell.font = { italic: true, size: 10, color: { argb: COLORS.gray } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } };
      cell.border = { left: thinBorder, right: thinBorder, bottom: thinBorder };
    });
    row++;
  }

  // Method row
  if (options.includeMethodInfo) {
    const methodData = ['', '', 'Method:', ...paramMetadata.map(p => p.method)];
    methodData.forEach((val, colIdx) => {
      const cell = sheet.getCell(row, colIdx + 1);
      cell.value = val;
      cell.font = { italic: true, size: 10, color: { argb: COLORS.gray } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
      cell.border = { left: thinBorder, right: thinBorder, bottom: thickBorder };
    });
    row++;
  }

  // Data rows
  const dataStartRow = row;
  orderedSamples.forEach((sample, sampleIdx) => {
    const sampleResults = resultMap.get(sample.sample_id);
    const isEvenRow = sampleIdx % 2 === 0;
    const bgColor = isEvenRow ? COLORS.white : COLORS.veryLightBlue;

    // Fixed columns
    const fixedData = [sample.sample_id, sample.field_id || '', sample.matrix];
    fixedData.forEach((val, colIdx) => {
      const cell = sheet.getCell(row, colIdx + 1);
      cell.value = val;
      cell.font = { size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        left: colIdx === 0 ? thickBorder : thinBorder,
        right: thinBorder,
        bottom: thinBorder,
      };
    });

    // Parameter columns
    parameters.forEach((param, paramIdx) => {
      const result = sampleResults?.get(param);
      const cell = sheet.getCell(row, fixedCols + paramIdx + 1);
      
      if (result) {
        cell.value = result.is_below_mdl ? `<${result.mdl}` : (result.entered_value || '');
      } else {
        cell.value = '';
      }
      
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'center' };
      
      // Alternating column colors within row
      const colIsEven = paramIdx % 2 === 0;
      let cellBg = bgColor;
      if (!isEvenRow && colIsEven) {
        cellBg = COLORS.lightBlue;
      } else if (isEvenRow && !colIsEven) {
        cellBg = COLORS.veryLightBlue;
      }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellBg } };
      
      cell.border = {
        left: thinBorder,
        right: paramIdx === parameters.length - 1 ? thickBorder : thinBorder,
        bottom: thinBorder,
      };
    });

    row++;
  });

  // Bottom border for last data row
  for (let col = 1; col <= totalCols; col++) {
    const cell = sheet.getCell(row - 1, col);
    cell.border = {
      ...cell.border,
      bottom: thickBorder,
    };
  }

  row++;

  // Footer
  sheet.mergeCells(row, 1, row, totalCols);
  const footerCell = sheet.getCell(row, 1);
  footerCell.value = '─── End of Results ───';
  footerCell.font = { italic: true, size: 10, color: { argb: COLORS.gray } };
  footerCell.alignment = { horizontal: 'center' };

  // Set column widths
  sheet.getColumn(1).width = 15; // Sample ID
  sheet.getColumn(2).width = 15; // Field ID
  sheet.getColumn(3).width = 12; // Matrix
  for (let i = 0; i < parameters.length; i++) {
    sheet.getColumn(fixedCols + i + 1).width = 12;
  }

  // Freeze header rows
  sheet.views = [{ state: 'frozen', ySplit: headerRowNum, xSplit: fixedCols }];
}

export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
