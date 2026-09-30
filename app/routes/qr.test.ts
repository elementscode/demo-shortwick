import { test, equal } from "@elements/app";
import { qrPng } from "./qr";
import { qrMatrix, qrSvg } from "#app/shared/services/qr";

test("qr", () => {
  test("the matrix is square with finder patterns in three corners", () => {
    let m = qrMatrix("http://localhost:4000/launch");
    let n = m.length;

    equal(m.every((row) => row.length === n), true);
    equal([m[0][0], m[0][n - 1], m[n - 1][0], m[n - 1][n - 1]], [true, true, true, false]);
  });

  test("the png is a png at 16px per module plus the quiet zone", () => {
    let png = qrPng("http://localhost:4000/launch");
    let modules = qrMatrix("http://localhost:4000/launch").length + 8;

    equal([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    equal(png.readUInt32BE(16), modules * 16);
  });

  test("the svg names the url it encodes", () => {
    equal(qrSvg("http://x.io/a").includes('aria-label="QR code for http://x.io/a"'), true);
  });
});
