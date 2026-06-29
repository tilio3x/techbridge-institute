import pg from "pg";
const { Pool } = pg;

const DATABASE_URL =
  "postgresql://postgredbadmin:l79ESuF2II8o@techbridge-db.postgres.database.azure.com:5432/postgres?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

const certifications = [
  // ── UniFi Platform — Current Courses ──
  { code: "UFSP", title: "UniFi Full Stack Professional", level: "Beginner", tags: ["Networking", "Infrastructure", "Security"],
    desc: "Full-day introductory course on the UniFi full-stack software suite covering Site Manager, Cloud Gateways, firewall, SD-WAN, and physical security solutions (Protect & Access).", duration: "1 day" },

  { code: "UWA", title: "UniFi Wireless Admin", level: "Intermediate", tags: ["Networking"],
    desc: "2-day in-class training on enterprise wireless networking concepts with emphasis on best practices for designing and managing UniFi WLANs with hands-on labs.", duration: "2 days" },

  { code: "URSCA", title: "UniFi Routing, Switching & Cybersecurity Admin", level: "Intermediate", tags: ["Networking", "Security"],
    desc: "2-3 day classroom training on fundamentals of designing, building and managing enterprise networks with hands-on activities using Cloud Gateway hardware.", duration: "3 days" },

  { code: "UNS", title: "UniFi Network Specialist", level: "Beginner", tags: ["Networking"],
    desc: "One-day introduction to the UniFi Controller with emphasis on server administration, device/site/network management, guest portal and hotspot manager.", duration: "1 day" },

  { code: "UNP", title: "UniFi Network Professional", level: "Intermediate", tags: ["Networking", "Infrastructure"],
    desc: "Advanced UniFi network design and management course for professionals deploying and maintaining enterprise UniFi network infrastructure.", duration: "2 days" },

  { code: "UWS", title: "UniFi Wireless Specialist", level: "Beginner", tags: ["Networking"],
    desc: "Entry-level UniFi wireless course covering fundamental concepts in WiFi design, deployment, and management of UniFi access points.", duration: "1 day" },

  // ── UISP Broadband Platform ──
  { code: "UBWS", title: "UISP Broadband Wireless Specialist", level: "Beginner", tags: ["Networking"],
    desc: "One-day in-class airMAX/airFiber training course for applied learning and entry-level certification in outdoor wireless networking.", duration: "1 day" },

  { code: "UBWA", title: "UISP Broadband Wireless Admin", level: "Intermediate", tags: ["Networking"],
    desc: "Two-day in-class training on outdoor wireless networking concepts with emphasis on designing, building, managing, and troubleshooting WISP networks using airOS-8 and airMAX AC.", duration: "2 days" },

  // ── Legacy / Routing & Switching ──
  { code: "UEWA", title: "Ubiquiti Enterprise Wireless Admin", level: "Intermediate", tags: ["Networking"],
    desc: "Two-day training for professionals managing large-scale indoor/outdoor deployments. Covers WLAN fundamentals, planning, deployment, configuration, and guest management.", duration: "2 days" },

  { code: "UBRSS", title: "Ubiquiti Broadband Routing & Switching Specialist", level: "Beginner", tags: ["Networking", "Infrastructure"],
    desc: "Training on core protocols and technologies used in service provider networks. Covers device management, IPv4, network design, routing, and security services.", duration: "2 days" },

  { code: "UBRSA", title: "Ubiquiti Broadband Routing & Switching Admin", level: "Intermediate", tags: ["Networking", "Infrastructure"],
    desc: "Advanced routing and switching for network administrators and ISPs. Covers VLANs, BGP, OSPF, QoS implementation, and advanced layer 2 networking.", duration: "2 days" },
];

async function main() {
  const { rows: existing } = await pool.query("SELECT code FROM courses");
  const normalize = (c) => c.replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").toUpperCase().trim();
  const existingSet = new Set(existing.map((r) => normalize(r.code)));

  let created = 0;
  let skipped = 0;

  for (const cert of certifications) {
    if (existingSet.has(normalize(cert.code))) {
      console.log(`SKIP  ${cert.code} — "${cert.title}" (already exists)`);
      skipped++;
      continue;
    }

    const nextStart = new Date();
    nextStart.setMonth(nextStart.getMonth() + 1);

    await pool.query(
      `INSERT INTO courses (vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12)`,
      [
        "ubiquiti",
        cert.code,
        cert.title,
        cert.level,
        cert.duration,
        0,
        30,
        "Hybrid",
        nextStart.toISOString().split("T")[0],
        cert.desc,
        "",
        cert.tags,
      ]
    );

    console.log(`ADD   ${cert.code} — "${cert.title}"`);
    created++;
    existingSet.add(normalize(cert.code));
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Total: ${certifications.length}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
