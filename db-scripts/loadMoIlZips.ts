// db-scripts/loadMoIlZips.ts
import { Client } from 'pg';
import { parse } from 'csv-parse';
import fetch from 'node-fetch';
import * as zlib from 'zlib';
import * as unzipper from 'unzipper';

// --------------  CONFIG  ------------------
const DATABASE_URL = process.env.DATABASE_URL!;
const ZIP_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/' +
  '2023_Gaz_zcta_national.zip';
// States to keep
const KEEP = new Set(['MO', 'IL']);

// --------------  MAIN  --------------------
(async () => {
  console.log('▶︎ downloading Gazetteer…');
  const res = await fetch(ZIP_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

  console.log('▶︎ extracting .txt from ZIP…');
  const zip = res.body!.pipe(unzipper.Parse({ forceStream: true }));
  let txtStream: NodeJS.ReadableStream | undefined;
  for await (const entry of zip) {
    if (entry.path.endsWith('.txt')) {
      txtStream = entry;
    } else {
      entry.autodrain();
    }
  }
  if (!txtStream) throw new Error('TXT not found inside ZIP');

  console.log('▶︎ parsing & filtering rows…');
  const parser = txtStream.pipe(
    parse({ delimiter: '\t', columns: true, relax_column_count: true })
  );

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const upsert =
    'INSERT INTO public.zipcode_coordinates ' +
    '(zipcode, city, state, latitude, longitude) ' +
    'VALUES ($1,$2,$3,$4,$5) ' +
    'ON CONFLICT (zipcode) DO UPDATE ' +
    'SET city = EXCLUDED.city, ' +
    '    state = EXCLUDED.state, ' +
    '    latitude = EXCLUDED.latitude, ' +
    '    longitude = EXCLUDED.longitude';

  let count = 0;
  for await (const r of parser) {
    if (!KEEP.has(r.USPS)) continue;
    await client.query(upsert, [
      r.ZCTA5,            // zipcode
      r.NAME,             // city
      r.USPS,             // state
      parseFloat(r.INTPTLAT),
      parseFloat(r.INTPTLONG)
    ]);
    count++;
    if (count % 100 === 0) process.stdout.write('.');
  }

  await client.end();
  console.log(`\n✓ inserted/updated ${count} ZIP codes for MO & IL`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
