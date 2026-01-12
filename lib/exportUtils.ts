import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportRecord = {
  tanggal: string;
  waktu: string;
  krani: string;
  divisi: string;
  gang: string;
  blok: string;
  op: string;
  rotasi: number;
  nama_pemanen: string;
  nomor_panen: number;
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
  const ws = XLSX.utils.json_to_sheet(data, {
    header: [
      'tanggal',
      'waktu',
      'krani',
      'divisi',
      'gang',
      'blok',
      'op',
      'rotasi',
      'nama_pemanen',
      'nomor_panen',
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
    tanggal: 'TANGGAL',
    waktu: 'WAKTU',
    krani: 'KRANI',
    divisi: 'DIVISI',
    gang: 'GANG',
    blok: 'BLOK',
    op: 'OP',
    rotasi: 'ROTASI',
    nama_pemanen: 'NAMA PEMANEN',
    nomor_panen: 'NOMOR PANEN',
    hasil_panen_jjg: 'HASIL PANEN (JJG)',
    nomor_tph: 'NOMOR TPH',
    bjr: 'BJR',
    brondolan_kg: 'BRONDOLAN (KG)',
    buah_masak: 'BUAH MASAK',
    buah_mentah: 'BUAH MENTAH',
    buah_mengkal: 'BUAH MENGKAL',
    overripe: 'OVERRIPE',
    abnormal: 'ABNORMAL',
    buah_busuk: 'BUAH BUSUK',
    tangkai_panjang: 'TANGKAI PANJANG',
    jangkos: 'JANGKOS',
    keterangan: 'KETERANGAN',
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
    { wch: 12 },
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

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 148, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Tanggal Export: ${currentDate}`, 148, 22, { align: 'center' });

  const tableData = data.map((record) => [
    record.tanggal,
    record.waktu,
    record.krani,
    record.divisi,
    record.gang,
    record.blok,
    record.op,
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
        'TANGGAL',
        'WAKTU',
        'KRANI',
        'DIVISI',
        'GANG',
        'BLOK',
        'OP',
        'ROTASI',
        'NAMA PEMANEN',
        'NO. PANEN',
        'JJG',
        'TPH',
        'BJR',
        'BRONDOLAN',
        'MASAK',
        'MENTAH',
        'MENGKAL',
        'OVERRIPE',
        'ABNORMAL',
        'BUSUK',
        'T. PANJANG',
        'JANGKOS',
        'KETERANGAN',
      ],
    ],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [45, 80, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 12 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 12 },
      5: { cellWidth: 15 },
      6: { cellWidth: 12 },
      7: { cellWidth: 10 },
      8: { cellWidth: 20 },
      9: { cellWidth: 12 },
      10: { cellWidth: 12 },
      11: { cellWidth: 10 },
      12: { cellWidth: 10 },
      13: { cellWidth: 15 },
      14: { cellWidth: 10 },
      15: { cellWidth: 10 },
      16: { cellWidth: 10 },
      17: { cellWidth: 10 },
      18: { cellWidth: 10 },
      19: { cellWidth: 10 },
      20: { cellWidth: 12 },
      21: { cellWidth: 10 },
      22: { cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 28 },
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${timestamp}.pdf`);
};
