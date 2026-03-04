import 'dotenv/config';
import { pool } from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const LOCALITIES = [
  'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
];

const COORDS: Record<string, [number, number]> = {
  'Jubilee Hills':  [17.4260, 78.4077],
  'Banjara Hills':  [17.4156, 78.4347],
  'Gachibowli':     [17.4401, 78.3489],
  'Kondapur':       [17.4600, 78.3614],
  'Kokapet':        [17.3900, 78.3200],
  'Hitech City':    [17.4486, 78.3908],
  'Madhapur':       [17.4484, 78.3915],
  'Nanakramguda':   [17.4147, 78.3541],
};

function crToRupees(cr: number): number { return Math.round(cr * 1_00_00_000); }
function rupeesToPaise(r: number): number { return r * 100; }
function priceInPaise(cr: number): number { return rupeesToPaise(crToRupees(cr)); }

const PROPERTIES: Array<{
  type: string; status: string; bedrooms: number | null; bathrooms: number | null;
  areaSqft: number; priceCr: number; label: string;
}> = [
  // 3BHK (20)
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'ready_to_move', bedrooms: 3, bathrooms: 3, areaSqft: 1800 + i * 50, priceCr: 1.5 + i * 0.2, label: '3BHK Apartment' })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'under_construction', bedrooms: 3, bathrooms: 2, areaSqft: 1600 + i * 60, priceCr: 1.2 + i * 0.15, label: '3BHK Flat' })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'ready_to_move', bedrooms: 3, bathrooms: 3, areaSqft: 2000 + i * 80, priceCr: 2.0 + i * 0.25, label: '3BHK Premium' })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'under_construction', bedrooms: 3, bathrooms: 2, areaSqft: 1500 + i * 40, priceCr: 0.95 + i * 0.1, label: '3BHK Luxury' })),
  // 4BHK (15)
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'ready_to_move', bedrooms: 4, bathrooms: 4, areaSqft: 2800 + i * 100, priceCr: 3.5 + i * 0.5, label: '4BHK Villa' })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'under_construction', bedrooms: 4, bathrooms: 3, areaSqft: 2500 + i * 80, priceCr: 3.0 + i * 0.4, label: '4BHK Apartment' })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'ready_to_move', bedrooms: 4, bathrooms: 4, areaSqft: 3200 + i * 120, priceCr: 5.0 + i * 0.8, label: '4BHK Penthouse Villa' })),
  // Penthouse (5)
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'residential', status: 'ready_to_move', bedrooms: 5, bathrooms: 5, areaSqft: 5000 + i * 300, priceCr: 10.0 + i * 1.0, label: 'Sky Penthouse' })),
  // Office (5)
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'commercial', status: 'ready_to_move', bedrooms: null, bathrooms: null, areaSqft: 3000 + i * 500, priceCr: 6.0 + i * 1.5, label: 'Grade A Office Space' })),
  // Plot (5)
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'plot', status: 'ready_to_move', bedrooms: null, bathrooms: null, areaSqft: 2000 + i * 400, priceCr: 2.5 + i * 0.6, label: 'DTCP Approved Plot' })),
];

const BUILDERS = [
  'Prestige Group', 'Phoenix Group', 'My Home Constructions',
  'Aparna Constructions', 'Aliens Space Station', 'Lodha Group',
  'DLF Limited', 'Sumadhura Group',
];

const AMENITIES_POOL = [
  'Swimming Pool', 'Gym', 'Clubhouse', 'CCTV Security', '24/7 Power Backup',
  'Car Parking', 'Children Play Area', 'Jogging Track', 'Landscaped Gardens',
  'Conference Room', 'Cafeteria', 'Visitor Parking',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function run() {
  const client = await pool.connect();
  try {
    // Run migration
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/001_initial.sql'),
      'utf8',
    );
    await client.query(migrationSQL);
    console.info('[Seed] Migration applied');

    // Agencies
    const agencyIds: string[] = [];
    const agencyData = [
      { name: 'Hyderabad Prime Realty', contact: 'Rajesh Kumar', email: 'rajesh@hprrealty.com', phone: '9848012345' },
      { name: 'Deccan Properties', contact: 'Priya Sharma', email: 'priya@deccanprop.com', phone: '9849023456' },
      { name: 'Golconda Realtors', contact: 'Venkat Rao', email: 'venkat@golcondarealty.com', phone: '9550034567' },
      { name: 'Cyberabad Homes', contact: 'Anita Reddy', email: 'anita@cyberabadh.com', phone: '9701045678' },
      { name: 'Pearl City Estates', contact: 'Suresh Naidu', email: 'suresh@pearlcity.com', phone: '9652056789' },
    ];
    for (const a of agencyData) {
      const id = uuidv4();
      agencyIds.push(id);
      await client.query(
        `INSERT INTO agencies (id, agency_name, contact_name, email, phone, subscription_status)
         VALUES ($1,$2,$3,$4,$5,'active')
         ON CONFLICT (email) DO NOTHING`,
        [id, a.name, a.contact, a.email, a.phone],
      );
    }
    console.info('[Seed] 5 agencies created');

    // Properties (50)
    let inserted = 0;
    for (let i = 0; i < PROPERTIES.length; i++) {
      const def = PROPERTIES[i]!;
      const locality = LOCALITIES[i % LOCALITIES.length]!;
      const [lat, lng] = COORDS[locality]!;
      const price = priceInPaise(def.priceCr);
      const pricePerSqft = Math.round(price / def.areaSqft);
      const reraStatuses = ['verified', 'verified', 'verified', 'pending', 'flagged'];
      const reraStatus = pick(reraStatuses);

      await client.query(
        `INSERT INTO properties (
           id, rera_number, rera_status, title, description, property_type, status,
           price, price_per_sqft, area_sqft, bedrooms, bathrooms,
           locality, city, lat, lng, pincode, amenities, builder_name, agency_id,
           photos, risk_score, roi_estimate_3yr, is_active, published_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,true,NOW()
         ) ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          `HYD-RERA-${String(2024000 + i).padStart(7, '0')}`,
          reraStatus,
          `${def.label} in ${locality}`,
          `Premium ${def.label} located in the heart of ${locality}, Hyderabad. ` +
          `${def.bedrooms ? `${def.bedrooms} spacious bedrooms` : 'Open plan layout'}, ` +
          `${def.areaSqft} sqft. Excellent connectivity to major IT hubs.`,
          def.type,
          def.status,
          price,
          pricePerSqft,
          def.areaSqft,
          def.bedrooms,
          def.bathrooms,
          locality,
          'Hyderabad',
          lat + (Math.random() - 0.5) * 0.02,
          lng + (Math.random() - 0.5) * 0.02,
          '500' + String(30 + (i % 70)).padStart(3, '0'),
          JSON.stringify(pickN(AMENITIES_POOL, 5 + Math.floor(Math.random() * 4))),
          pick(BUILDERS),
          pick(agencyIds),
          JSON.stringify([
            `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800`,
            `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800`,
          ]),
          20 + Math.floor(Math.random() * 60),
          (8 + Math.random() * 10).toFixed(1),
        ],
      );
      inserted++;
    }
    console.info(`[Seed] ${inserted} properties created`);

    // Users (10)
    const userTypes = ['resident_hni', 'nri', 'institutional', 'home_buyer'];
    for (let i = 0; i < 10; i++) {
      const email = `investor${i + 1}@propellex.dev`;
      await client.query(
        `INSERT INTO users (id, email, name, user_type, preferences)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO NOTHING`,
        [
          uuidv4(),
          email,
          `Test Investor ${i + 1}`,
          pick(userTypes),
          JSON.stringify({
            budget_min: crToRupees(1 + i * 0.5),
            budget_max: crToRupees(5 + i * 1),
            localities: pickN(LOCALITIES, 2),
            property_types: ['residential'],
            roi_target: 10 + Math.floor(Math.random() * 8),
            risk_appetite: pick(['low', 'medium', 'high']),
          }),
        ],
      );
    }
    console.info('[Seed] 10 users created');

    // Market intelligence (20)
    const newsItems = [
      { title: 'Hyderabad sees 34% rise in luxury home sales in Q3 2024', category: 'price', sentiment: 'positive', locality: 'Gachibowli' },
      { title: 'Telangana RERA registers 500+ new projects in October', category: 'policy', sentiment: 'positive', locality: 'Hyderabad' },
      { title: 'Metro Phase 3 to connect Kokapet to Hitech City', category: 'infra', sentiment: 'positive', locality: 'Kokapet' },
      { title: 'IT corridor property prices rise 18% YoY in Madhapur', category: 'price', sentiment: 'positive', locality: 'Madhapur' },
      { title: 'New ORR access road boosts Nanakramguda connectivity', category: 'infra', sentiment: 'positive', locality: 'Nanakramguda' },
      { title: 'Banjara Hills luxury segment stabilises after surge', category: 'price', sentiment: 'neutral', locality: 'Banjara Hills' },
      { title: 'GHMC approves 12 new residential townships in outer ring', category: 'policy', sentiment: 'neutral', locality: 'Hyderabad' },
      { title: 'Home loan rates hold steady at 8.5% as RBI pauses', category: 'policy', sentiment: 'neutral', locality: 'Hyderabad' },
      { title: 'Gachibowli commercial real estate demand up 22%', category: 'price', sentiment: 'positive', locality: 'Gachibowli' },
      { title: 'Kondapur emerges as mid-premium residential hotspot', category: 'news', sentiment: 'positive', locality: 'Kondapur' },
      { title: 'Jubilee Hills sees record ₹15Cr penthouse sale in Nov', category: 'news', sentiment: 'positive', locality: 'Jubilee Hills' },
      { title: 'New data center parks to drive demand in Kokapet', category: 'infra', sentiment: 'positive', locality: 'Kokapet' },
      { title: 'Hyderabad ranks #2 in NRI investment preferences: survey', category: 'news', sentiment: 'positive', locality: 'Hyderabad' },
      { title: 'Rental yields in Hitech City average 3.8% in 2024', category: 'price', sentiment: 'neutral', locality: 'Hitech City' },
      { title: 'RERA complaints rise 12% in Q3 — buyers warned to verify', category: 'policy', sentiment: 'negative', locality: 'Hyderabad' },
      { title: 'Global IT slowdown creates mild headwinds for office sector', category: 'news', sentiment: 'negative', locality: 'Gachibowli' },
      { title: 'Telangana government extends PMAY deadline to March 2025', category: 'policy', sentiment: 'neutral', locality: 'Hyderabad' },
      { title: 'Luxury villas in Banjara Hills clock 9-month sell-out', category: 'news', sentiment: 'positive', locality: 'Banjara Hills' },
      { title: 'Hyderabad airport metro link to boost Shamshabad corridor', category: 'infra', sentiment: 'positive', locality: 'Hyderabad' },
      { title: 'Prestige Group launches 200-unit project in Nanakramguda', category: 'news', sentiment: 'positive', locality: 'Nanakramguda' },
    ];

    for (const item of newsItems) {
      await client.query(
        `INSERT INTO market_intelligence (id, title, summary, source_name, category, locality_tags, sentiment, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
         ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          item.title,
          `${item.title}. This development signals continued growth momentum in the ${item.locality} micro-market. Analysts expect sustained demand through Q1 2025.`,
          pick(['Economic Times', 'Business Standard', 'The Hindu', 'Moneycontrol']),
          item.category,
          JSON.stringify([item.locality]),
          item.sentiment,
        ],
      );
    }
    console.info('[Seed] 20 market intelligence articles created');

    // Price history — 24 months per locality
    for (const locality of LOCALITIES) {
      const basePrice = 8_000_000 + Math.floor(Math.random() * 4_000_000); // paise per sqft
      for (let m = 23; m >= 0; m--) {
        const date = new Date();
        date.setMonth(date.getMonth() - m);
        const trend = 1 + (23 - m) * 0.006; // ~0.6% monthly growth
        const noise = 1 + (Math.random() - 0.5) * 0.04;
        await client.query(
          `INSERT INTO price_history (id, locality, month, avg_price_per_sqft)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (locality, month) DO NOTHING`,
          [
            uuidv4(),
            locality,
            date.toISOString().slice(0, 7) + '-01',
            Math.round(basePrice * trend * noise),
          ],
        );
      }
    }
    console.info('[Seed] Price history seeded for 8 localities × 24 months');

    console.info('[Seed] ✓ All done!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('[Seed] Failed:', err); process.exit(1); });
