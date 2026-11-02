import { createRequire } from 'node:module';
import fs from 'node:fs';
// Ferramenta opcional de geração: npm install --prefix .qa/icon-tools --no-save --ignore-scripts @resvg/resvg-js
const require = createRequire(import.meta.url);
const { Resvg } = require('../.qa/icon-tools/node_modules/@resvg/resvg-js');
try {
  const source = fs.readFileSync(
    'node_modules/@mui/icons-material/esm/SpaOutlined.js',
    'utf8',
  );
  const shape = /d: "([^"]+)"/.exec(source)[1];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect x="32" y="32" width="960" height="960" rx="230" fill="#a9dfbf"/><g transform="translate(212 212) scale(25)" fill="#17251e"><path d="${shape}"/></g></svg>`;
  fs.writeFileSync('resources/contabily.svg', svg);
  const full = new Resvg(svg).render().asPng();
  fs.writeFileSync('build/icon.png', full);
  fs.writeFileSync('resources/icon.png', full);
  fs.writeFileSync('src/renderer/src/assets/contabily.png', full);
  const sizes = [16, 32, 48, 64, 128, 256];
  const buffers = sizes.map((size) =>
    Buffer.from(
      new Resvg(svg, { fitTo: { mode: 'width', value: size } })
        .render()
        .asPng(),
    ),
  );
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  buffers.forEach((buffer, index) => {
    const pos = 6 + index * 16;
    header[pos] = sizes[index] === 256 ? 0 : sizes[index];
    header[pos + 1] = header[pos];
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(buffer.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += buffer.length;
  });
  fs.writeFileSync('build/icon.ico', Buffer.concat([header, ...buffers]));
  const chunks = await Promise.all(
    [
      [128, 'ic07'],
      [256, 'ic08'],
      [512, 'ic09'],
      [1024, 'ic10'],
    ].map(async ([size, type]) => {
      const data = Buffer.from(
          new Resvg(svg, { fitTo: { mode: 'width', value: size } })
            .render()
            .asPng(),
        ),
        chunk = Buffer.alloc(8);
      chunk.write(type);
      chunk.writeUInt32BE(8 + data.length, 4);
      return Buffer.concat([chunk, data]);
    }),
  );
  const icns = Buffer.alloc(8);
  icns.write('icns');
  icns.writeUInt32BE(8 + chunks.reduce((sum, item) => sum + item.length, 0), 4);
  fs.writeFileSync('build/icon.icns', Buffer.concat([icns, ...chunks]));
  console.log('Ícones PNG, ICO e ICNS gerados do SpaOutlined usado no layout.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
