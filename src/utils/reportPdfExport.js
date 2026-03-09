import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// ESM/Vite: jsPDF is not on window, so autoTable is never attached. Attach explicitly.
applyPlugin(jsPDF);

/**
 * Format number as VND (used in PDF only)
 */
const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

/** Noto Sans Regular (Vietnamese support) - cache base64, đăng ký 1 lần qua events */
const FONT_NAME = 'NotoSans-Regular';
const FONT_STYLE = 'normal';
const FONT_FILE = 'NotoSans-Regular-normal.ttf';
const FONT_URLS = ['/fonts/NotoSans-Regular.ttf'];
let fontBase64Cache = null;
let fontEventPushed = false;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Tải font TTF (base64) và đăng ký vào jsPDF qua API.events.
 * @returns {Promise<boolean>} true nếu tải font thành công, false nếu không (dùng font mặc định)
 */
async function loadVietnameseFontOnce() {
  if (fontBase64Cache !== null) {
    if (!fontEventPushed) {
      const base64 = fontBase64Cache;
      jsPDF.API.events.push([
        'addFonts',
        function callAddFont() {
          this.addFileToVFS(FONT_FILE, base64);
          this.addFont(FONT_FILE, FONT_NAME, FONT_STYLE);
        },
      ]);
      fontEventPushed = true;
    }
    return true;
  }
  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength < 1000) continue;
      const base64 = arrayBufferToBase64(arrayBuffer);
      fontBase64Cache = base64;
      jsPDF.API.events.push([
        'addFonts',
        function callAddFont() {
          this.addFileToVFS(FONT_FILE, base64);
          this.addFont(FONT_FILE, FONT_NAME, FONT_STYLE);
        },
      ]);
      fontEventPushed = true;
      return true;
    } catch (_e) {
      // thử URL tiếp theo
    }
  }
  return false;
}

/** Cấu hình font cho bảng khi dùng font tiếng Việt */
const tableFontStyles = {
  font: FONT_NAME,
  fontStyle: FONT_STYLE,
};

/**
 * Export report data to PDF.
 * Does not mutate any input; uses only the provided data snapshot.
 * Uses a Vietnamese-capable font (Noto Sans) so dấu tiếng Việt hiển thị đúng.
 *
 * @param {Object} options
 * @param {Object} options.revenueData - { data: [], summary: {} }
 * @param {Object} options.topProducts - { data: [] }
 * @param {Object|null} options.rescueEfficiency - rescue report object or null
 * @param {Object} options.cashFlowData - { data: [], summary: {} }
 * @param {Object} options.costRetailData - { data: [], summary: {} }
 * @param {Array} options.dateRange - [dayjs, dayjs]
 * @param {string} options.period - 'day'|'week'|'month'
 * @param {string} [options.filename] - optional filename (without .pdf)
 * @returns {Promise<{ fontLoaded: boolean }>} fontLoaded = false khi dùng font mặc định (chữ Việt có thể sai dấu)
 */
export async function exportReportToPdf(options) {
  const {
    revenueData = { data: [], summary: {} },
    topProducts = { data: [] },
    rescueEfficiency = null,
    cashFlowData = { data: [], summary: {} },
    costRetailData = { data: [], summary: {} },
    dateRange = [],
    period = 'day',
    filename,
  } = options;

  const fontLoaded = await loadVietnameseFontOnce();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  if (fontLoaded) {
    doc.setFont(FONT_NAME, FONT_STYLE);
  } else {
    doc.setFont('helvetica', 'normal');
  }

  const tableStyles = fontLoaded ? tableFontStyles : { font: 'helvetica', fontStyle: 'normal' };
  const headFont = fontLoaded ? { font: FONT_NAME, fontStyle: FONT_STYLE } : {};

  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;
  const margin = 14;
  const maxW = pageW - margin * 2;

  const periodLabel = { day: 'Ngày', week: 'Tuần', month: 'Tháng' }[period] || period;
  const dateFrom = dateRange[0]?.format?.('DD/MM/YYYY') || '';
  const dateTo = dateRange[1]?.format?.('DD/MM/YYYY') || '';
  const title = `Báo cáo doanh số - ${dateFrom} → ${dateTo} (theo ${periodLabel})`;

  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Xuất ngày: ${new Date().toLocaleString('vi-VN')}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  const maybeNewPage = (needSpace = 20) => {
    if (y > 270) {
      doc.addPage();
      y = 14;
    }
    y += needSpace;
  };

  // --- Summary (revenue) ---
  const summary = revenueData.summary || {};
  doc.setFontSize(12);
  doc.text('1. Tổng quan', margin, y);
  y += 6;
  const summaryRows = [
    ['Tổng doanh thu', formatVND(summary.total_revenue)],
    ['Tổng lợi nhuận', formatVND(summary.total_profit)],
    ['Tổng đơn hàng', (summary.total_orders ?? 0).toLocaleString('vi-VN') + ' đơn'],
    [
      'Tỷ lệ lợi nhuận',
      summary.total_revenue
        ? (
            ((summary.total_profit || 0) / (summary.total_revenue || 1)) *
            100
          ).toFixed(1) + '%'
        : '0%',
    ],
  ];
  doc.autoTable({
    startY: y,
    head: [['Chỉ số', 'Giá trị']],
    body: summaryRows,
    margin: { left: margin },
    theme: 'grid',
    styles: tableStyles,
    headStyles: { fillColor: [22, 119, 255], ...headFont },
    bodyStyles: tableStyles,
    tableLineWidth: 0.1,
  });
  y = doc.lastAutoTable.finalY + 10;
  maybeNewPage(0);

  // --- Revenue & Profit by period ---
  if (revenueData.data?.length) {
    doc.setFontSize(12);
    doc.text('2. Doanh thu & Lợi nhuận theo kỳ', margin, y);
    y += 6;
    const revRows = revenueData.data.map((d) => [
      d.label,
      formatVND(d.revenue),
      formatVND(d.profit),
    ]);
    doc.autoTable({
      startY: y,
      head: [['Kỳ', 'Doanh thu', 'Lợi nhuận']],
      body: revRows,
      margin: { left: margin },
      theme: 'grid',
      styles: tableStyles,
      headStyles: { fillColor: [22, 119, 255], ...headFont },
      bodyStyles: tableStyles,
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 10;
    maybeNewPage(0);
  }

  // --- Top products ---
  if (topProducts.data?.length) {
    doc.setFontSize(12);
    doc.text('3. Top sản phẩm bán chạy', margin, y);
    y += 6;
    const productRows = topProducts.data.slice(0, 15).map((p, i) => [
      i + 1,
      (p.product_name || '').substring(0, 35),
      (p.total_quantity ?? 0).toLocaleString('vi-VN'),
      formatVND(p.total_revenue),
    ]);
    doc.autoTable({
      startY: y,
      head: [['#', 'Sản phẩm', 'Số lượng bán', 'Doanh thu']],
      body: productRows,
      margin: { left: margin },
      theme: 'grid',
      styles: tableStyles,
      headStyles: { fillColor: [114, 46, 209], ...headFont },
      bodyStyles: tableStyles,
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 10;
    maybeNewPage(0);
  }

  // --- Rescue efficiency ---
  if (rescueEfficiency) {
    doc.setFontSize(12);
    doc.text('4. Hiệu quả cứu hàng', margin, y);
    y += 6;
    const rescueRows = [
      ['Doanh thu từ bán giảm giá (Recovered)', formatVND(rescueEfficiency.recovered_revenue)],
      ['Tổn thất hủy hàng (Loss of cost)', formatVND(rescueEfficiency.loss_of_cost)],
      ['Tỷ lệ cứu thành công', (rescueEfficiency.successful_rescue_rate ?? 0) + '%'],
      ['Lượng bán giảm giá', (rescueEfficiency.quantity_sold_at_discount ?? 0) + ' đơn vị'],
      ['Lượng hủy', (rescueEfficiency.quantity_destroyed ?? 0) + ' đơn vị'],
    ];
    doc.autoTable({
      startY: y,
      head: [['Chỉ số', 'Giá trị']],
      body: rescueRows,
      margin: { left: margin },
      theme: 'grid',
      styles: tableStyles,
      headStyles: { fillColor: [250, 140, 22], ...headFont },
      bodyStyles: tableStyles,
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 10;
    maybeNewPage(0);
  }

  // --- Cash flow ---
  if (cashFlowData.data?.length) {
    doc.setFontSize(12);
    doc.text('5. Dòng tiền (Cash Flow)', margin, y);
    y += 6;
    const cfRows = cashFlowData.data.map((d) => [
      d.label,
      formatVND(d.inflow),
      formatVND(d.outflow_total),
    ]);
    doc.autoTable({
      startY: y,
      head: [['Kỳ', 'Thu vào (Doanh thu)', 'Chi ra (Tồn kho + Vận hành)']],
      body: cfRows,
      margin: { left: margin },
      theme: 'grid',
      styles: tableStyles,
      headStyles: { fillColor: [90, 216, 166], ...headFont },
      bodyStyles: tableStyles,
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 6;
    const cfSummary = cashFlowData.summary || {};
    doc.setFontSize(9);
    doc.text(
      `Tổng thu: ${formatVND(cfSummary.total_inflow)} | Tổng chi: ${formatVND(cfSummary.total_outflow)} | Ròng: ${formatVND(cfSummary.net_cash_flow)}`,
      margin,
      y
    );
    y += 10;
    maybeNewPage(0);
  }

  // --- Cost vs Retail trend ---
  if (costRetailData.data?.length) {
    doc.setFontSize(12);
    doc.text('6. Xu hướng Giá vốn vs Giá bán lẻ', margin, y);
    y += 6;
    const crRows = costRetailData.data.map((d) => [
      d.label,
      formatVND(d.avg_cost),
      formatVND(d.avg_retail),
      (d.total_quantity ?? 0).toLocaleString('vi-VN'),
    ]);
    doc.autoTable({
      startY: y,
      head: [['Kỳ', 'Giá vốn TB', 'Giá bán lẻ TB', 'Số lượng']],
      body: crRows,
      margin: { left: margin },
      theme: 'grid',
      styles: tableStyles,
      headStyles: { fillColor: [91, 143, 249], ...headFont },
      bodyStyles: tableStyles,
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  const name =
    filename ||
    `Bao-cao-danh-so_${dateFrom.replace(/\//g, '-')}_${dateTo.replace(/\//g, '-')}.pdf`;
  doc.save(name);
  return { fontLoaded };
}

export default exportReportToPdf;
