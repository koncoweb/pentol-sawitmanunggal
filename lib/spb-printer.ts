
export interface SpbPrintData {
  nomor_spb: string;
  tanggal: string;
  estate_name: string;
  divisi_name: string;
  driver_name: string;
  vehicle_no: string; // fleet number
  vehicle_plate: string;
  loader_names: string;
  km_awal: number;
  km_akhir: number;
  items: {
    blok_name: string;
    tahun_tanam: string;
    jumlah_janjang: number;
    keterangan: string;
  }[];
}

export const generateSpbHtml = (data: SpbPrintData) => {
  const kmSelisih = Math.max(0, data.km_akhir - data.km_awal);

  const rowsHtml = data.items.map((item, index) => {
    return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${item.blok_name || '-'}</td>
        <td style="text-align: center;">${item.tahun_tanam || ''}</td>
        <td style="text-align: center;">${item.jumlah_janjang}</td>
        <td>${item.keterangan || ''}</td>
      </tr>
    `;
  }).join('');

  const emptyRowsCount = Math.max(0, 10 - data.items.length);
  const emptyRowsHtml = Array(emptyRowsCount).fill(0).map(() => `
    <tr>
      <td>&nbsp;</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            margin: 20px;
            size: A4 portrait;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 0;
            margin: 0;
            font-size: 12px;
          }
          .container {
            border: 2px solid #000;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            min-height: 90vh;
            position: relative;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .doc-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 2px;
          }
          .doc-subtitle {
            font-size: 12px;
            font-style: italic;
          }
          
          .meta-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .meta-column {
            width: 48%;
          }
          .meta-row {
            display: flex;
            margin-bottom: 5px;
            align-items: flex-end;
          }
          .meta-label {
            width: 110px;
            font-weight: bold;
          }
          .meta-separator {
            width: 10px;
          }
          .meta-value {
            flex: 1;
            border-bottom: 1px dotted #999;
            padding-bottom: 2px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            font-size: 12px;
          }
          th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            border: 1px solid #000;
            padding: 10px;
          }
          .km-info {
            width: 40%;
          }
          .km-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            border-bottom: 1px dotted #ccc;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding: 0 20px;
          }
          .sig-box {
            width: 28%;
            text-align: center;
            display: flex;
            flex-direction: column;
            min-height: 120px;
          }
          .sig-role {
            font-weight: bold;
            margin-bottom: 60px;
          }
          .sig-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            font-weight: bold;
          }
          
          /* Print optimizations */
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
            }
            .container {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">PT. AEP NUSANTARA PLANTATIONS</div>
            <div class="doc-title">SURAT PENGANTAR BUAH (SPB)</div>
            <div class="doc-subtitle">Fruit Delivery Note</div>
          </div>

          <div class="meta-grid">
            <div class="meta-column">
              <div class="meta-row">
                <div class="meta-label">Estate / Divisi</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.estate_name || '-'} / ${data.divisi_name || '-'}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">Tanggal</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.tanggal}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">No. SPB</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.nomor_spb || '-'}</div>
              </div>
            </div>
            <div class="meta-column">
              <div class="meta-row">
                <div class="meta-label">Nama Supir</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.driver_name || '-'}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">No. Kendaraan</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.vehicle_no || '-'} / ${data.vehicle_plate || '-'}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">Pemuat</div>
                <div class="meta-separator">:</div>
                <div class="meta-value">${data.loader_names || '-'}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">No</th>
                <th>Blok</th>
                <th style="width: 100px;">Tahun Tanam</th>
                <th style="width: 120px;">Jumlah Janjang</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${emptyRowsHtml}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td colspan="3" style="text-align: right; padding-right: 10px;">TOTAL</td>
                <td style="text-align: center;">
                  ${data.items.reduce((sum, item) => sum + (Number(item.jumlah_janjang) || 0), 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer-section">
            <div class="km-info">
              <div style="font-weight: bold; margin-bottom: 5px;">ODOMETER (KM)</div>
              <div class="km-row">
                <span>Berangkat (Awal)</span>
                <span>${data.km_awal}</span>
              </div>
              <div class="km-row">
                <span>Tiba (Akhir)</span>
                <span>${data.km_akhir}</span>
              </div>
              <div class="km-row" style="border-bottom: none; font-weight: bold;">
                <span>Jarak Tempuh</span>
                <span>${kmSelisih}</span>
              </div>
            </div>
            <div style="flex: 1; margin-left: 20px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Catatan:</div>
              <div style="border: 1px solid #ccc; height: 60px; border-radius: 4px;"></div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-role">Dibuat Oleh</div>
              <div class="sig-line">Krani / Transporter</div>
            </div>
            <div class="sig-box">
              <div class="sig-role">Diperiksa Oleh</div>
              <div class="sig-line">Field Asisten</div>
            </div>
            <div class="sig-box">
              <div class="sig-role">Diketahui Oleh</div>
              <div class="sig-line">Estate Manager / SA</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 10px; text-align: right; color: #666;">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </body>
    </html>
  `;
};
