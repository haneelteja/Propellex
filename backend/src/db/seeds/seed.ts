import 'dotenv/config';
import { pool } from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ── Real Hyderabad properties (15) ────────────────────────────────────────────
// Prices stored in PAISE (rupees × 100) per schema convention.

const REAL_PROPERTIES = [
  {
    title: '3BHK Premium Apartment in Sattva Magnus, Jubilee Hills',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 2850000000,          // ₹2.85 Cr in paise
    price_per_sqft: 1140000,    // ₹11,400/sqft in paise
    area_sqft: 2500,
    bedrooms: 3, bathrooms: 3,
    locality: 'Jubilee Hills', city: 'Hyderabad',
    lat: 17.4239, lng: 78.3988,
    amenities: ['gym','swimming_pool','clubhouse','landscaped_garden','children_play_area','power_backup','24x7_security','visitor_parking','lift','cctv'],
    builder_name: 'Salarpuria Sattva Group',
    rera_number: 'P02400003890', rera_status: 'registered',
    risk_score: 18, roi_estimate_3yr: 34.5,
    description: 'Located within Sattva Magnus on Shaikpet Road, this 3BHK spans 2,500 sqft across four premium towers on 5.4 acres. The community commands sweeping views of Durgam Cheruvu lake and KBR Park. Jubilee Hills remains one of Hyderabad\'s most consistent capital-appreciation corridors at ₹11,000–12,000/sqft.',
    analysis_priority: 'high',
    published_at: '2026-01-15 10:00:00+05:30',
  },
  {
    title: '4BHK Ultra-Luxury Apartment in Realplus Fuji Halcyon, Jubilee Hills',
    property_type: 'residential',
    status: 'under_construction',
    price: 9500000000,          // ₹9.5 Cr in paise
    price_per_sqft: 1253200,    // ₹12,532/sqft in paise
    area_sqft: 7580,
    bedrooms: 4, bathrooms: 5,
    locality: 'Jubilee Hills', city: 'Hyderabad',
    lat: 17.4256, lng: 78.4012,
    amenities: ['gym','swimming_pool','rooftop_lounge','private_lift_lobby','concierge','ev_charging','clubhouse','squash_court','yoga_studio','power_backup','24x7_security','cctv','visitor_parking'],
    builder_name: 'Realplus Developers',
    rera_number: 'P02500005860', rera_status: 'registered',
    risk_score: 30, roi_estimate_3yr: 38.0,
    description: 'Realplus Fuji Halcyon offers 4 & 5BHK residences in the 7,504–10,121 sqft range, positioned as ultra-low-density luxury in the heart of Jubilee Hills. RERA registration P02500005860 is confirmed; the project is under active construction. Premium location and limited supply justify a strong 3-year appreciation outlook.',
    analysis_priority: 'high',
    published_at: '2026-02-01 10:00:00+05:30',
  },
  {
    title: '3BHK Luxury Apartment in Trendset Marigold, Banjara Hills',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 5500000000,          // ₹5.5 Cr in paise
    price_per_sqft: 1550000,    // ₹15,500/sqft in paise
    area_sqft: 3550,
    bedrooms: 3, bathrooms: 3,
    locality: 'Banjara Hills', city: 'Hyderabad',
    lat: 17.4156, lng: 78.4347,
    amenities: ['gym','swimming_pool','clubhouse','multipurpose_hall','landscaped_garden','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','rainwater_harvesting'],
    builder_name: 'Trendset Builders',
    rera_number: 'P02500006589', rera_status: 'registered',
    risk_score: 15, roi_estimate_3yr: 30.0,
    description: 'Trendset Marigold offers 3 & 4BHK configurations in 3,346–4,467 sqft in one of Banjara Hills\' most prestigious micro-markets. Trendset is a respected Hyderabad developer with a solid delivery track record. Average Banjara Hills flat prices have appreciated 11.2% over three years, with consistent rental demand from senior executives and expats.',
    analysis_priority: 'high',
    published_at: '2026-01-20 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Vamsiram Jyothi Valencia, Banjara Hills',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 1850000000,          // ₹1.85 Cr in paise
    price_per_sqft: 995000,     // ₹9,950/sqft in paise
    area_sqft: 1860,
    bedrooms: 3, bathrooms: 3,
    locality: 'Banjara Hills', city: 'Hyderabad',
    lat: 17.4122, lng: 78.4298,
    amenities: ['gym','swimming_pool','clubhouse','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','water_softening_plant'],
    builder_name: 'Vamsiram Builders',
    rera_number: 'P02500004210', rera_status: 'registered',
    risk_score: 20, roi_estimate_3yr: 28.5,
    description: 'Vamsiram Jyothi Valencia is the highest-transacted project in Banjara Hills over the past year, with 5 recorded registrations — a strong signal of liquidity. Located near Road No. 12, this 3BHK unit is semi-furnished and ready to move. Vamsiram has an established reputation in Hyderabad for quality mid-to-premium segment housing.',
    analysis_priority: 'medium',
    published_at: '2026-01-10 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Rajapushpa Regalia, Gachibowli',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 2400000000,          // ₹2.4 Cr in paise
    price_per_sqft: 960000,     // ₹9,600/sqft in paise
    area_sqft: 2500,
    bedrooms: 3, bathrooms: 3,
    locality: 'Gachibowli', city: 'Hyderabad',
    lat: 17.4401, lng: 78.3489,
    amenities: ['gym','swimming_pool','clubhouse','jogging_track','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','visitor_parking','indoor_games'],
    builder_name: 'Rajapushpa Properties',
    rera_number: 'P02400001820', rera_status: 'registered',
    risk_score: 12, roi_estimate_3yr: 32.0,
    description: 'Rajapushpa Regalia is one of the most trusted ready-to-occupy communities in Gachibowli, developed by Rajapushpa Properties — widely regarded as Hyderabad\'s most reliable western-corridor builder. The complex houses 1,100+ families and is steps from the Financial District. Strong IT-sector rental demand makes this a top-tier investment.',
    analysis_priority: 'high',
    published_at: '2026-02-10 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in My Home Vihanga, Nanakramguda – Gachibowli',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 2400000000,          // ₹2.4 Cr in paise
    price_per_sqft: 914300,     // ₹9,143/sqft in paise
    area_sqft: 2625,
    bedrooms: 3, bathrooms: 3,
    locality: 'Gachibowli', city: 'Hyderabad',
    lat: 17.4303, lng: 78.3612,
    amenities: ['gym','swimming_pool','clubhouse','landscaped_garden','jogging_track','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','tennis_court'],
    builder_name: 'My Home Constructions',
    rera_number: 'P02400002217', rera_status: 'registered',
    risk_score: 14, roi_estimate_3yr: 31.0,
    description: 'My Home Vihanga sits at the Nanakramguda–Gachibowli junction, listed at ₹2.4 Cr as recently as March 2026 per NoBroker. My Home Constructions is one of Hyderabad\'s most reputed Grade-A developers. The location\'s proximity to Nanakramguda ORR exit and Financial District drives strong resale and rental premiums.',
    analysis_priority: 'high',
    published_at: '2026-03-18 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Cybercity Marina Skies, Hitech City',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 1950000000,          // ₹1.95 Cr in paise
    price_per_sqft: 1026300,    // ₹10,263/sqft in paise
    area_sqft: 1900,
    bedrooms: 3, bathrooms: 3,
    locality: 'Hitech City', city: 'Hyderabad',
    lat: 17.4476, lng: 78.3763,
    amenities: ['gym','swimming_pool','clubhouse','rooftop_terrace','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','indoor_games','visitor_parking'],
    builder_name: 'Cybercity Builders & Developers',
    rera_number: 'P02200002674', rera_status: 'registered',
    risk_score: 16, roi_estimate_3yr: 29.0,
    description: 'Cybercity Marina Skies is a RERA-registered ready-to-move project in the heart of Hitech City, Hyderabad\'s primary IT employment nucleus. Unit sizes range from 1,250–4,070 sqft; this 3BHK at 1,900 sqft is priced at ₹1.95 Cr. Proximity to Hitech City metro station and Cyber Towers ensures robust rental yield.',
    analysis_priority: 'high',
    published_at: '2026-01-25 10:00:00+05:30',
  },
  {
    title: '4BHK Ultra-Premium Apartment in Savya The Edition, Hitech City',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 5700000000,          // ₹5.7 Cr in paise
    price_per_sqft: 1600000,    // ₹16,000/sqft in paise
    area_sqft: 3562,
    bedrooms: 4, bathrooms: 4,
    locality: 'Hitech City', city: 'Hyderabad',
    lat: 17.4498, lng: 78.3802,
    amenities: ['gym','infinity_pool','spa','concierge','ev_charging','rooftop_lounge','clubhouse','squash_court','yoga_studio','power_backup','24x7_security','cctv','visitor_parking','lift','smart_home_automation'],
    builder_name: 'Savya Constructions',
    rera_number: 'P02400009340', rera_status: 'registered',
    risk_score: 14, roi_estimate_3yr: 35.0,
    description: 'Savya The Edition is one of Hitech City\'s finest ultra-luxury offerings, with 4 & 5BHK apartments in the 3,555–5,555 sqft range and RERA registration confirmed. This 4BHK unit at ₹5.7 Cr represents the top tier of the Hitech City luxury market. The project\'s scarcity premium and RERA compliance keep risk low.',
    analysis_priority: 'high',
    published_at: '2026-02-05 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Gowra Tulips, Madhapur',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 1520000000,          // ₹1.52 Cr in paise
    price_per_sqft: 950000,     // ₹9,500/sqft in paise
    area_sqft: 1600,
    bedrooms: 3, bathrooms: 3,
    locality: 'Madhapur', city: 'Hyderabad',
    lat: 17.4485, lng: 78.3908,
    amenities: ['gym','swimming_pool','clubhouse','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','visitor_parking'],
    builder_name: 'Gowra Ventures',
    rera_number: 'P02200008833', rera_status: 'registered',
    risk_score: 20, roi_estimate_3yr: 26.0,
    description: 'Gowra Tulips at Gafoor Nagar, Madhapur was listed for ₹1.52 Cr on NoBroker in February 2026. Madhapur commands ₹9,000–10,500/sqft for ready-to-move stock given co-location with Cyber Towers, Westin Hotel, and major hospitals. Gowra Ventures has an established Hyderabad presence spanning two decades.',
    analysis_priority: 'medium',
    published_at: '2026-02-23 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in My Home Navadweepa, Hitech City – Madhapur',
    property_type: 'residential',
    status: 'under_construction',
    price: 2300000000,          // ₹2.3 Cr in paise
    price_per_sqft: 1068300,    // ₹10,683/sqft in paise
    area_sqft: 2153,
    bedrooms: 3, bathrooms: 3,
    locality: 'Madhapur', city: 'Hyderabad',
    lat: 17.4510, lng: 78.3845,
    amenities: ['gym','swimming_pool','clubhouse','jogging_track','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','indoor_games','multipurpose_hall'],
    builder_name: 'My Home Constructions',
    rera_number: 'P02400008821', rera_status: 'registered',
    risk_score: 22, roi_estimate_3yr: 33.0,
    description: 'My Home Navadweepa is an under-construction premium project by My Home Constructions listed at ₹2.3 Cr (NoBroker, Feb 2026). The developer\'s exemplary delivery record in Hyderabad substantially mitigates construction risk. Madhapur\'s demand-supply gap near Hitech City makes this a strong medium-term appreciation bet.',
    analysis_priority: 'high',
    published_at: '2026-02-08 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Rajapushpa Pristinia, Kokapet',
    property_type: 'residential',
    status: 'under_construction',
    price: 1750000000,          // ₹1.75 Cr in paise
    price_per_sqft: 784900,     // ₹7,849/sqft in paise
    area_sqft: 2229,
    bedrooms: 3, bathrooms: 3,
    locality: 'Kokapet', city: 'Hyderabad',
    lat: 17.3980, lng: 78.3250,
    amenities: ['gym','temperature_controlled_pool','60000_sqft_clubhouse','jogging_track','cycling_track','tennis_court','badminton_court','squash_court','cricket_net','children_play_area','yoga_deck','power_backup','24x7_security','cctv','covered_parking','lift','ev_charging'],
    builder_name: 'Rajapushpa Properties',
    rera_number: 'P02400006086', rera_status: 'registered',
    risk_score: 18, roi_estimate_3yr: 42.0,
    description: 'Rajapushpa Pristinia at Kokapet Neopolis offers 60,000 sqft of clubhouse amenities on 12.1 acres with 1,782 units — RERA-registered at P02400006086. Kokapet is Hyderabad\'s fastest-appreciating western corridor, with sqft rates surging 40%+ in three years. Located 5 minutes from Financial District and Wipro Circle.',
    analysis_priority: 'high',
    published_at: '2026-01-12 10:00:00+05:30',
  },
  {
    title: '4BHK Luxury Apartment in Lansum Elena, Kokapet',
    property_type: 'residential',
    status: 'under_construction',
    price: 4500000000,          // ₹4.5 Cr in paise
    price_per_sqft: 1200000,    // ₹12,000/sqft in paise
    area_sqft: 3754,
    bedrooms: 4, bathrooms: 4,
    locality: 'Kokapet', city: 'Hyderabad',
    lat: 17.3965, lng: 78.3198,
    amenities: ['gym','55000_sqft_clubhouse','sky_bridges','biophilic_landscaping','swimming_pool','children_play_area','jogging_track','power_backup','24x7_security','cctv','ev_charging','lift','rooftop_terrace','yoga_studio'],
    builder_name: 'Lansum Endpoint Developers',
    rera_number: 'P02400007341', rera_status: 'registered',
    risk_score: 24, roi_estimate_3yr: 40.0,
    description: 'Lansum Elena on Golden Mile Road Kokapet features twin 55-floor towers on 3.6 acres with iconic sky bridges and biophilic design. The 3 & 4BHK apartments (2,459–3,754 sqft) are priced around ₹12,000/sqft. Kokapet\'s ORR adjacency and Financial District proximity continue to drive among Hyderabad\'s highest appreciation rates.',
    analysis_priority: 'high',
    published_at: '2026-02-20 10:00:00+05:30',
  },
  {
    title: '3BHK Premium Apartment in 360 Life The Origin, Kondapur',
    property_type: 'residential',
    status: 'under_construction',
    price: 2281400000,          // ₹2.28 Cr in paise
    price_per_sqft: 850000,     // ₹8,500/sqft in paise
    area_sqft: 2684,
    bedrooms: 3, bathrooms: 3,
    locality: 'Kondapur', city: 'Hyderabad',
    lat: 17.4583, lng: 78.3642,
    amenities: ['gym','swimming_pool','65000_sqft_clubhouse','banquet_hall','steam_sauna','badminton_court','squash_court','jogging_track','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','zumba_hall'],
    builder_name: '360 Realtors',
    rera_number: 'P02400007518', rera_status: 'registered',
    risk_score: 28, roi_estimate_3yr: 27.0,
    description: 'Listed at ₹2.28 Cr on multiple portals, this 3BHK in 360 Life The Origin Tower 2 is a landlord unit in a G+35 high-rise with possession slated for Dec 2026. Kondapur has direct access to Hitech City (2 km) and Google/TCS campuses, maintaining steady IT-sector rental demand at ₹35,000–50,000/month for this configuration.',
    analysis_priority: 'medium',
    published_at: '2026-01-30 10:00:00+05:30',
  },
  {
    title: '4BHK Ultra-Luxury Apartment in Sumadhura Acropolis, Nanakramguda',
    property_type: 'residential',
    status: 'under_construction',
    price: 5800000000,          // ₹5.8 Cr in paise
    price_per_sqft: 1200000,    // ₹12,000/sqft in paise
    area_sqft: 4833,
    bedrooms: 4, bathrooms: 4,
    locality: 'Nanakramguda', city: 'Hyderabad',
    lat: 17.4269, lng: 78.3405,
    amenities: ['gym','infinity_pool','spa','concierge','rooftop_sky_deck','clubhouse','tennis_court','squash_court','badminton_court','jogging_track','ev_charging','power_backup','24x7_security','cctv','lift','smart_home_automation','children_play_area'],
    builder_name: 'Sumadhura Group',
    rera_number: 'P02400009117', rera_status: 'registered',
    risk_score: 22, roi_estimate_3yr: 38.0,
    description: 'Sumadhura Acropolis rises majestically over the Nanakramguda skyline in the Hyderabad Financial District zone. This 4BHK at ~₹5.8 Cr reflects the premium commanded by Nanakramguda\'s immediate ORR-junction positioning. Sumadhura Group is a well-regarded Hyderabad developer with multiple timely deliveries on record.',
    analysis_priority: 'high',
    published_at: '2026-02-15 10:00:00+05:30',
  },
  {
    title: '3BHK Apartment in Indis Sia Prospera, Miyapur',
    property_type: 'residential',
    status: 'ready_to_move',
    price: 1790000000,          // ₹1.79 Cr in paise
    price_per_sqft: 749900,     // ₹7,499/sqft in paise
    area_sqft: 2388,
    bedrooms: 3, bathrooms: 3,
    locality: 'Miyapur', city: 'Hyderabad',
    lat: 17.4972, lng: 78.3445,
    amenities: ['gym','swimming_pool','clubhouse','jogging_track','children_play_area','power_backup','24x7_security','cctv','covered_parking','lift','yoga_room','function_hall','indoor_games'],
    builder_name: 'Indis Constructions',
    rera_number: 'P02400007079', rera_status: 'registered',
    risk_score: 19, roi_estimate_3yr: 22.0,
    description: 'Indis Sia Prospera near Miyapur X-Roads offers 3 & 4BHK residences in 2,388–3,434 sqft, priced ₹1.79–2.58 Cr, RERA-registered (P02400007079). The project is 3.3 km from Miyapur Metro Station with connectivity to JNTU and Kukatpally. Miyapur\'s affordable pricing tier and improving metro access sustain steady end-user demand.',
    analysis_priority: 'medium',
    published_at: '2026-01-05 10:00:00+05:30',
  },
];

const LOCALITIES = [
  'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda', 'Miyapur',
];

function crToRupees(cr: number): number { return Math.round(cr * 1_00_00_000); }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function run() {
  const client = await pool.connect();
  try {
    // Run migrations
    for (const file of ['001_initial.sql', '002_agency_intent.sql', '003_roles.sql']) {
      const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
      await client.query(sql);
      console.info(`[Seed] Migration applied: ${file}`);
    }

    // Agencies
    const agencyData = [
      { name: 'Hyderabad Prime Realty', contact: 'Rajesh Kumar', email: 'rajesh@hprrealty.com', phone: '9848012345' },
      { name: 'Deccan Properties', contact: 'Priya Sharma', email: 'priya@deccanprop.com', phone: '9849023456' },
      { name: 'Golconda Realtors', contact: 'Venkat Rao', email: 'venkat@golcondarealty.com', phone: '9550034567' },
      { name: 'Cyberabad Homes', contact: 'Anita Reddy', email: 'anita@cyberabadh.com', phone: '9701045678' },
      { name: 'Pearl City Estates', contact: 'Suresh Naidu', email: 'suresh@pearlcity.com', phone: '9652056789' },
    ];
    for (const a of agencyData) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO agencies (id, agency_name, contact_name, email, phone, subscription_status)
         VALUES ($1,$2,$3,$4,$5,'active')
         ON CONFLICT (email) DO NOTHING`,
        [id, a.name, a.contact, a.email, a.phone],
      );
    }
    const agencyRows = await client.query<{ id: string }>(`SELECT id FROM agencies`);
    const agencyIds = agencyRows.rows.map((r) => r.id);
    if (agencyIds.length === 0) throw new Error('No agencies found after insert');
    console.info('[Seed] 5 agencies ready');

    // Clear existing properties and insert 15 real ones
    await client.query(`DELETE FROM properties`);
    console.info('[Seed] Cleared existing properties');

    const photos = JSON.stringify([
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ]);

    for (const p of REAL_PROPERTIES) {
      await client.query(
        `INSERT INTO properties (
           id, title, property_type, status, price, price_per_sqft, area_sqft,
           bedrooms, bathrooms, locality, city, lat, lng, amenities,
           builder_name, rera_number, rera_status, risk_score, roi_estimate_3yr,
           description, analysis_priority, agency_id, photos,
           pincode, is_active, published_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,true,$25
         ) ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          p.title, p.property_type, p.status,
          p.price, p.price_per_sqft, p.area_sqft,
          p.bedrooms, p.bathrooms,
          p.locality, p.city, p.lat, p.lng,
          JSON.stringify(p.amenities),
          p.builder_name, p.rera_number, p.rera_status,
          p.risk_score, p.roi_estimate_3yr,
          p.description, p.analysis_priority,
          pick(agencyIds),
          photos,
          '500034',
          p.published_at,
        ],
      );
    }
    console.info(`[Seed] ${REAL_PROPERTIES.length} real properties inserted`);

    // Manager account
    await client.query(
      `INSERT INTO users (id, email, name, role, preferences)
       VALUES ($1,$2,$3,'manager','{}')
       ON CONFLICT (email) DO UPDATE SET role = 'manager'`,
      [uuidv4(), 'manager@propellex.dev', 'Platform Manager'],
    );
    console.info('[Seed] Manager account: manager@propellex.dev');

    // Investor users (10)
    const userTypes = ['resident_hni', 'nri', 'institutional', 'home_buyer'];
    for (let i = 0; i < 10; i++) {
      await client.query(
        `INSERT INTO users (id, email, name, user_type, preferences)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO NOTHING`,
        [
          uuidv4(),
          `investor${i + 1}@propellex.dev`,
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
    console.info('[Seed] 10 investor users created');

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
      const basePrice = 8_000_000 + Math.floor(Math.random() * 4_000_000);
      for (let m = 23; m >= 0; m--) {
        const date = new Date();
        date.setMonth(date.getMonth() - m);
        const trend = 1 + (23 - m) * 0.006;
        const noise = 1 + (Math.random() - 0.5) * 0.04;
        await client.query(
          `INSERT INTO price_history (id, locality, month, avg_price_per_sqft)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (locality, month) DO NOTHING`,
          [uuidv4(), locality, date.toISOString().slice(0, 7) + '-01', Math.round(basePrice * trend * noise)],
        );
      }
    }
    console.info('[Seed] Price history seeded for 9 localities × 24 months');

    console.info('[Seed] ✓ All done!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('[Seed] Failed:', err); process.exit(1); });
