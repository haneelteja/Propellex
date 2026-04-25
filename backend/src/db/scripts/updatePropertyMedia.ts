/**
 * Assigns curated Unsplash photos and real YouTube property-tour videos to every
 * active property in the database. Photos are chosen by property_type + price tier;
 * videos are assigned from a pool of real Hyderabad locality tour videos found on
 * YouTube. Run with: npm run update-media
 */
import 'dotenv/config';
import { pool } from '../../config/db';

// ── Unsplash photo pools (real photographs, CDN-served, always available) ──────

/** Luxury residential: high-rise interiors, skyline views, premium finishes */
const POOL_LUXURY_APARTMENT = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800&q=80&auto=format&fit=crop',
];

/** Premium residential: well-appointed apartments, modern kitchens, amenities */
const POOL_PREMIUM_APARTMENT = [
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format&fit=crop',
];

/** Villa / independent house: exteriors, garden, pool, spacious interiors */
const POOL_VILLA = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80&auto=format&fit=crop',
];

/** Commercial: office towers, lobbies, modern workspaces */
const POOL_COMMERCIAL = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop',
];

/** Plot / land: open land, green landscapes, development sites */
const POOL_PLOT = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop',
];

// ── Real YouTube video pools by locality (verified via search, April 2026) ─────
// Format: YouTube embed URLs — directly usable in <iframe src="...">

const VIDEO_POOL: Record<string, string[]> = {
  'Jubilee Hills': [
    'https://www.youtube.com/embed/jHDjxnLvNh0', // Luxury Apartment Interior Designs @ Jubilee Hills
    'https://www.youtube.com/embed/PlZKj3rOFxE', // Jubilee Hills Review: Connectivity, Property Rates
    'https://www.youtube.com/embed/8ohc3wbCJlU', // Halcyon High-end Luxury apartment in Jubilee Hills
    'https://www.youtube.com/embed/QIRhlAzXkVE', // Jubilee Hills 4K Multi Crore Houses
    'https://www.youtube.com/embed/jpEjJKQeFbc', // Richest Area of India – Jubilee Hills Tour
  ],
  'Banjara Hills': [
    'https://www.youtube.com/embed/_rOysrlcbro', // Luxury Indian Apartment Tour in Banjara Hills
    'https://www.youtube.com/embed/KATmg5-fYXE', // Luxury Villa for Sale in Banjara Hills
    'https://www.youtube.com/embed/hnyCIDQ9BL4', // Inside ₹14 Crore Ultra Luxury 4BHK Villa
    'https://www.youtube.com/embed/VUII668xRm8', // Amali Luxury Apartments in Banjara Hills
    'https://www.youtube.com/embed/eTeanesEbWo', // Banjara Hills Review: Connectivity, Property Rates
  ],
  'Gachibowli': [
    'https://www.youtube.com/embed/CtSclhMDc3Y', // Hyderabad's MOST Expensive Duplex – Gachibowli 2024
    'https://www.youtube.com/embed/9kL_YKM-2xs', // Vertex Panache Luxury Gated Community Gachibowli
    'https://www.youtube.com/embed/FQa3EA7RQKc', // Exploring Gachibowli – Comprehensive Area Guide
    'https://www.youtube.com/embed/R9bg1-VWsfA', // Gachibowli Review: Property Prices & Connectivity
    'https://www.youtube.com/embed/c_YPNkJS0_k', // L&T Serene County Gachibowli Apartment Tour
  ],
  'Hitech City': [
    'https://www.youtube.com/embed/qHoXzEIHl0o', // Hitech City: IT Corridor in Hyderabad
    'https://www.youtube.com/embed/QnNjDyrtsuk', // Hitec City 2026 | Sattva Knowledge IT Park Drive
    'https://www.youtube.com/embed/FQa3EA7RQKc', // Gachibowli–Hitech City Area Guide
  ],
  'Kondapur': [
    'https://www.youtube.com/embed/KAQ8Rt1IgPM', // Modern 2BHK in Kondapur – Full Apartment Tour
    'https://www.youtube.com/embed/Adqfi11Nmnc', // Kondapur, Hyderabad
    'https://www.youtube.com/embed/HLxkMRUU5vI', // Kondapur Streets Hytechcity Hyderabad
    'https://www.youtube.com/embed/qHoXzEIHl0o', // Hitech City IT Corridor (adjacent to Kondapur)
  ],
  'Kokapet': [
    'https://www.youtube.com/embed/9Oe7YOgbwJI', // 4 BHK Luxury Flat Tour Kokapet – 47th Floor Infinity Pool
    'https://www.youtube.com/embed/uCHGQPjWisA', // ₹9 Cr Model Flat MSN One Neopolis Kokapet
    'https://www.youtube.com/embed/CymjQOm5z8U', // Inside the MOST EXPENSIVE Villa in Kokapet
    'https://www.youtube.com/embed/-g7JXD0OGV0', // Neopolis Kokapet Residential Projects Tour 2024
    'https://www.youtube.com/embed/vBg0lHmTP1c', // 3 & 4 BHK Flats for Sale in Kokapet
  ],
  'Nanakramguda': [
    'https://www.youtube.com/embed/512g6IKPZHk', // New Hyderabad – Kokapet Nanakramguda 4K Drive
    'https://www.youtube.com/embed/kHmNT9sRT1M', // Ultra Luxury 17,000 sq ft Villa in Hyderabad
    'https://www.youtube.com/embed/CtSclhMDc3Y', // Hyderabad's MOST Expensive Duplex
    'https://www.youtube.com/embed/9Oe7YOgbwJI', // 4 BHK Luxury Flat Tour – 47th Floor Infinity Pool
  ],
  'Madhapur': [
    'https://www.youtube.com/embed/qHoXzEIHl0o', // Hitech City IT Corridor (Madhapur is part of same belt)
    'https://www.youtube.com/embed/FQa3EA7RQKc', // Gachibowli–Madhapur Comprehensive Area Guide
    'https://www.youtube.com/embed/KAQ8Rt1IgPM', // Modern Apartment Tour in the IT corridor
    'https://www.youtube.com/embed/QnNjDyrtsuk', // Hitec City 2026 Drive
  ],
};

/** Fallback pool used when locality has no specific videos */
const VIDEO_FALLBACK = [
  'https://www.youtube.com/embed/CtSclhMDc3Y',
  'https://www.youtube.com/embed/9Oe7YOgbwJI',
  'https://www.youtube.com/embed/PlZKj3rOFxE',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick 5 photos from pool starting at a deterministic offset based on property index */
function pickPhotos(pool: string[], offset: number): string[] {
  const photos: string[] = [];
  const len = pool.length;
  for (let i = 0; i < 5; i++) {
    photos.push(pool[(offset * 5 + i) % len]);
  }
  return photos;
}

function pickVideo(locality: string, idx: number): string {
  const pool = VIDEO_POOL[locality] ?? VIDEO_FALLBACK;
  return pool[idx % pool.length];
}

interface PropertyRow {
  id: string;
  property_type: string;
  locality: string;
  price: string; // bigint comes as string from pg
}

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<PropertyRow>(
      `SELECT id, property_type, locality, price
       FROM properties
       WHERE is_active = true
       ORDER BY locality, property_type, price ASC`,
    );

    console.info(`[Media] Updating ${rows.length} properties with photos and videos...`);

    // Track per-locality and per-type index for deterministic variety
    const localityIdx: Record<string, number> = {};
    const typeIdx: Record<string, number> = {};

    let updated = 0;
    for (const row of rows) {
      const price = Number(row.price);
      const iIdx = typeIdx[row.property_type] ?? 0;
      typeIdx[row.property_type] = iIdx + 1;

      const lIdx = localityIdx[row.locality] ?? 0;
      localityIdx[row.locality] = lIdx + 1;

      let photoPool: string[];
      if (row.property_type === 'plot') {
        photoPool = POOL_PLOT;
      } else if (row.property_type === 'commercial') {
        photoPool = POOL_COMMERCIAL;
      } else {
        // residential / villa — check title later; use price tier
        const isTitleVilla = false; // enriched in villa-specific seed entries by type hint
        if (isTitleVilla || price >= 5_000_000_000) {
          photoPool = POOL_VILLA;
        } else if (price >= 2_000_000_000) {
          photoPool = POOL_LUXURY_APARTMENT;
        } else {
          photoPool = POOL_PREMIUM_APARTMENT;
        }
      }

      const photos = pickPhotos(photoPool, iIdx);
      const videoUrl = pickVideo(row.locality, lIdx);

      await client.query(
        `UPDATE properties SET photos = $1, video_url = $2, updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(photos), videoUrl, row.id],
      );
      updated++;

      if (updated % 10 === 0) {
        console.info(`[Media] ${updated}/${rows.length} updated...`);
      }
    }

    console.info(`[Media] Done — ${updated} properties updated with photos and video URLs.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[Media] Fatal error:', err);
  process.exit(1);
});
