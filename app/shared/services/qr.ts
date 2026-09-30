import qrcode from "qrcode-generator";

/** The QR modules for a url, row by row: true is a dark module. */
export function qrMatrix(text: string): boolean[][] {
  let qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();

  let size = qr.getModuleCount();
  let rows: boolean[][] = [];

  for (let r = 0; r < size; r++) {
    let row: boolean[] = [];

    for (let c = 0; c < size; c++) {
      row.push(qr.isDark(r, c));
    }

    rows.push(row);
  }

  return rows;
}

/** One path for every dark module, with the four-module quiet zone QR readers want. */
export function qrSvg(text: string, px: number = 200): string {
  let rows = qrMatrix(text);
  let quiet = 4;
  let span = rows.length + quiet * 2;
  let d = "";

  rows.forEach((row, r) => {
    row.forEach((dark, c) => {
      if (dark) {
        d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${span} ${span}" shape-rendering="crispEdges" role="img" aria-label="QR code for ${text}"><rect width="${span}" height="${span}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}
