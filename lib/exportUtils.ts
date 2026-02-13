import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import i18n from './i18n';

export type ExportRecord = {
  tanggal: string;
  waktu: string;
  krani: string;
  divisi: string;
  gang: string;
  blok: string;
  tahun_tanam: string;
  rotasi: number;
  nama_pemanen: string;
  nomor_panen: string;
  hasil_panen_jjg: number;
  nomor_tph: string;
  bjr: number;
  brondolan_kg: number;
  buah_masak: number;
  buah_mentah: number;
  buah_mengkal: number;
  overripe: number;
  abnormal: number;
  buah_busuk: number;
  tangkai_panjang: number;
  jangkos: number;
  keterangan: string;
};

export const exportToExcel = (
  data: ExportRecord[],
  filename: string = 'laporan_panen'
) => {
  const totals = data.reduce((acc, record) => ({
    hasil_panen_jjg: acc.hasil_panen_jjg + (record.hasil_panen_jjg || 0),
    brondolan_kg: acc.brondolan_kg + (record.brondolan_kg || 0),
    buah_masak: acc.buah_masak + (record.buah_masak || 0),
    buah_mentah: acc.buah_mentah + (record.buah_mentah || 0),
    buah_mengkal: acc.buah_mengkal + (record.buah_mengkal || 0),
    overripe: acc.overripe + (record.overripe || 0),
    abnormal: acc.abnormal + (record.abnormal || 0),
    buah_busuk: acc.buah_busuk + (record.buah_busuk || 0),
    tangkai_panjang: acc.tangkai_panjang + (record.tangkai_panjang || 0),
    jangkos: acc.jangkos + (record.jangkos || 0),
  }), {
    hasil_panen_jjg: 0,
    brondolan_kg: 0,
    buah_masak: 0,
    buah_mentah: 0,
    buah_mengkal: 0,
    overripe: 0,
    abnormal: 0,
    buah_busuk: 0,
    tangkai_panjang: 0,
    jangkos: 0,
  });

  const totalRecord = {
    tanggal: i18n.t('export.total'),
    waktu: '',
    krani: '',
    divisi: '',
    gang: '',
    blok: '',
    tahun_tanam: '',
    rotasi: null as any,
    nama_pemanen: '',
    nomor_panen: '',
    hasil_panen_jjg: totals.hasil_panen_jjg,
    nomor_tph: '',
    bjr: null as any,
    brondolan_kg: totals.brondolan_kg,
    buah_masak: totals.buah_masak,
    buah_mentah: totals.buah_mentah,
    buah_mengkal: totals.buah_mengkal,
    overripe: totals.overripe,
    abnormal: totals.abnormal,
    buah_busuk: totals.buah_busuk,
    tangkai_panjang: totals.tangkai_panjang,
    jangkos: totals.jangkos,
    keterangan: '',
  };

  const ws = XLSX.utils.json_to_sheet([...data, totalRecord], {
    header: [
      'tanggal',
      'waktu',
      'krani',
      'divisi',
      'gang',
      'blok',
      'tahun_tanam',
      'rotasi',
      'nama_pemanen',
      'hasil_panen_jjg',
      'nomor_tph',
      'bjr',
      'brondolan_kg',
      'buah_masak',
      'buah_mentah',
      'buah_mengkal',
      'overripe',
      'abnormal',
      'buah_busuk',
      'tangkai_panjang',
      'jangkos',
      'keterangan',
    ],
  });

  const headerMap: Record<string, string> = {
    tanggal: i18n.t('export.headers.date'),
    waktu: i18n.t('export.headers.time'),
    krani: i18n.t('export.headers.krani'),
    divisi: i18n.t('export.headers.division'),
    gang: i18n.t('export.headers.gang'),
    blok: i18n.t('export.headers.block'),
    tahun_tanam: i18n.t('export.headers.plantingYear'),
    rotasi: i18n.t('export.headers.rotation'),
    nama_pemanen: i18n.t('export.headers.harvester'),
    nomor_panen: i18n.t('export.headers.harvestNum'),
    hasil_panen_jjg: i18n.t('export.headers.yieldBunch'),
    nomor_tph: i18n.t('export.headers.tphNum'),
    bjr: i18n.t('export.headers.bjr'),
    brondolan_kg: i18n.t('export.headers.looseFruit'),
    buah_masak: i18n.t('export.headers.ripe'),
    buah_mentah: i18n.t('export.headers.unripe'),
    buah_mengkal: i18n.t('export.headers.halfRipe'),
    overripe: i18n.t('export.headers.overripe'),
    abnormal: i18n.t('export.headers.abnormal'),
    buah_busuk: i18n.t('export.headers.rotten'),
    tangkai_panjang: i18n.t('export.headers.longStalk'),
    jangkos: i18n.t('export.headers.emptyBunch'),
    keterangan: i18n.t('export.headers.notes'),
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    const key = ws[address].v as string;
    if (headerMap[key]) {
      ws[address].v = headerMap[key];
    }
  }

  const colWidths = [
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 8 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Panen');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
};

export const exportToPDF = (
  data: ExportRecord[],
  filename: string = 'laporan_panen',
  title: string = 'LAPORAN PANEN'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const totals = data.reduce((acc, record) => ({
    hasil_panen_jjg: acc.hasil_panen_jjg + (record.hasil_panen_jjg || 0),
    brondolan_kg: acc.brondolan_kg + (record.brondolan_kg || 0),
    buah_masak: acc.buah_masak + (record.buah_masak || 0),
    buah_mentah: acc.buah_mentah + (record.buah_mentah || 0),
    buah_mengkal: acc.buah_mengkal + (record.buah_mengkal || 0),
    overripe: acc.overripe + (record.overripe || 0),
    abnormal: acc.abnormal + (record.abnormal || 0),
    buah_busuk: acc.buah_busuk + (record.buah_busuk || 0),
    tangkai_panjang: acc.tangkai_panjang + (record.tangkai_panjang || 0),
    jangkos: acc.jangkos + (record.jangkos || 0),
  }), {
    hasil_panen_jjg: 0,
    brondolan_kg: 0,
    buah_masak: 0,
    buah_mentah: 0,
    buah_mengkal: 0,
    overripe: 0,
    abnormal: 0,
    buah_busuk: 0,
    tangkai_panjang: 0,
    jangkos: 0,
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 148, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`${i18n.t('reports.exportDate')}: ${currentDate}`, 148, 22, { align: 'center' });

  const tableData = data.map((record) => [
    record.tanggal,
    record.waktu,
    record.krani,
    record.divisi,
    record.gang,
    record.blok,
    record.tahun_tanam,
    record.rotasi,
    record.nama_pemanen,
    record.nomor_panen,
    record.hasil_panen_jjg,
    record.nomor_tph,
    record.bjr,
    record.brondolan_kg,
    record.buah_masak,
    record.buah_mentah,
    record.buah_mengkal,
    record.overripe,
    record.abnormal,
    record.buah_busuk,
    record.tangkai_panjang,
    record.jangkos,
    record.keterangan,
  ]);

  autoTable(doc, {
    head: [
      [
        i18n.t('reports.pdfHeaders.date'),
        i18n.t('reports.pdfHeaders.time'),
        i18n.t('reports.pdfHeaders.krani'),
        i18n.t('reports.pdfHeaders.division'),
        i18n.t('reports.pdfHeaders.gang'),
        i18n.t('reports.pdfHeaders.block'),
        i18n.t('reports.pdfHeaders.plantingYear'),
        i18n.t('reports.pdfHeaders.rotation'),
        i18n.t('reports.pdfHeaders.harvester'),
        i18n.t('reports.pdfHeaders.harvestNum'),
        i18n.t('reports.pdfHeaders.yieldBunch'),
        i18n.t('reports.pdfHeaders.tph'),
        i18n.t('reports.pdfHeaders.bjr'),
        i18n.t('reports.pdfHeaders.looseFruit'),
        i18n.t('reports.pdfHeaders.ripe'),
        i18n.t('reports.pdfHeaders.unripe'),
        i18n.t('reports.pdfHeaders.halfRipe'),
        i18n.t('reports.pdfHeaders.overripe'),
        i18n.t('reports.pdfHeaders.abnormal'),
        i18n.t('reports.pdfHeaders.rotten'),
        i18n.t('reports.pdfHeaders.longStalk'),
        i18n.t('reports.pdfHeaders.emptyBunch'),
        i18n.t('reports.pdfHeaders.notes'),
      ],
    ],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 6,
      cellPadding: 1,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [45, 80, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 14 }, // Tanggal
      1: { cellWidth: 9 },  // Waktu
      2: { cellWidth: 16 }, // Krani
      3: { cellWidth: 12 }, // Divisi
      4: { cellWidth: 10 }, // Gang
      5: { cellWidth: 12 }, // Blok
      6: { cellWidth: 9 },  // Thn Tanam
      7: { cellWidth: 8 },  // Rotasi
      8: { cellWidth: 18 }, // Nama Pemanen
      9: { cellWidth: 8 },  // No. Panen
      10: { cellWidth: 8 }, // JJG
      11: { cellWidth: 8 }, // TPH
      12: { cellWidth: 8 }, // BJR
      13: { cellWidth: 10 },// Brondolan
      14: { cellWidth: 8 }, // Masak
      15: { cellWidth: 8 }, // Mentah
      16: { cellWidth: 8 }, // Mengkal
      17: { cellWidth: 8 }, // Overripe
      18: { cellWidth: 8 }, // Abnormal
      19: { cellWidth: 8 }, // Busuk
      20: { cellWidth: 8 }, // T. Panjang
      21: { cellWidth: 8 }, // Jangkos
      22: { cellWidth: 'auto' }, // Keterangan
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    foot: [
      [
        i18n.t('export.total'),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        totals.hasil_panen_jjg,
        '',
        '',
        totals.brondolan_kg.toFixed(2),
        totals.buah_masak,
        totals.buah_mentah,
        totals.buah_mengkal,
        totals.overripe,
        totals.abnormal,
        totals.buah_busuk,
        totals.tangkai_panjang,
        totals.jangkos,
        '',
      ],
    ],
    footStyles: {
      fillColor: [45, 80, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { top: 28, left: 10, right: 10 },
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${timestamp}.pdf`);
};
