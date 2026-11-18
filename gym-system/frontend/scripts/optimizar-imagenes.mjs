// Convierte las imágenes del carrusel y el logo a WebP ligero.
// Uso: node scripts/optimizar-imagenes.mjs   (desde gym-system/frontend)
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";

const kb = async (f) => Math.round((await stat(f)).size / 1024);
const dir = "public/images";

for (const f of await readdir(dir)) {
  if (!/\.(png|jpe?g)$/i.test(f)) continue;
  const entrada = `${dir}/${f}`;
  const salida = `${dir}/${f.replace(/\.(png|jpe?g)$/i, ".webp")}`;
  await sharp(entrada).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(salida);
  console.log(`✓ ${salida}  ${await kb(entrada)} KB → ${await kb(salida)} KB`);
}

await sharp("public/logo_final.png").resize(256, 256, { fit: "inside" }).webp({ quality: 85 }).toFile("public/logo_final.webp");
console.log(`✓ public/logo_final.webp  ${await kb("public/logo_final.png")} KB → ${await kb("public/logo_final.webp")} KB`);
