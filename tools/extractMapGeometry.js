/**
 * One-time extractor: reads Code/Handler/Maps.as and writes mapGeometry.json.
 * Run from repo root: node tools/extractMapGeometry.js
 */
const fs = require('fs');
const path = require('path');
const { parseAllMapsFromSource } = require('../MapLoader');

const mapsPath = path.join(__dirname, '..', 'Code', 'Handler', 'Maps.as');
const outPath = path.join(__dirname, '..', 'mapGeometry.json');

const source = fs.readFileSync(mapsPath, 'utf8');
const data = parseAllMapsFromSource(source);

fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Wrote ${outPath} (${Object.keys(data).length} maps)`);
for (const [id, shapes] of Object.entries(data)) {
    console.log(`  map ${id}: ${shapes.length} static shapes`);
}
