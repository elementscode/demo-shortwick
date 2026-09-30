import { Request, Response, NotFoundError, session, sql } from "@elements/app";
import { deflateSync } from "zlib";
import { qrMatrix } from "#app/shared/services/qr";
import { originOf } from "#app/shared/services/origin";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;

  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }

  return c >>> 0;
});

function crc32(bytes: Buffer): number {
  let c = 0xffffffff;

  for (let b of bytes) {
    c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  }

  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  let length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  let body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  let crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, crc]);
}

/** A black-on-white grayscale PNG, `scale` pixels per module. */
export function qrPng(text: string, scale: number = 16): Buffer {
  let rows = qrMatrix(text);
  let quiet = 4;
  let modules = rows.length + quiet * 2;
  let size = modules * scale;

  // Each scanline is a filter byte (0, none) and then one byte per pixel.
  let raw = Buffer.alloc((size + 1) * size, 255);

  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0;
    let r = Math.floor(y / scale) - quiet;

    for (let x = 0; x < size; x++) {
      let c = Math.floor(x / scale) - quiet;

      if (rows[r]?.[c]) {
        raw[y * (size + 1) + 1 + x] = 0;
      }
    }
  }

  let header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export default function serveQr(req: Request, res: Response) {
  session.isLoggedInOrThrow();

  let link = sql<{ slug: string }>(`
    select slug from links where id = ${req.params.id} and userId = ${session.getOrThrow("userId")}
  `).first();

  if (!link) {
    throw new NotFoundError("link not found");
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="shortwick-${link.slug}.png"`);
  res.setHeader("Cache-Control", "private, max-age=3600");

  return qrPng(`${originOf(req)}/${link.slug}`);
}
