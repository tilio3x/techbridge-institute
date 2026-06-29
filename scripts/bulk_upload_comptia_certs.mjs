import pg from "pg";
const { Pool } = pg;

const DATABASE_URL =
  "postgresql://postgredbadmin:l79ESuF2II8o@techbridge-db.postgres.database.azure.com:5432/postgres?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

const certifications = [
  // ── Beginner / Novice (Essentials & a+ Series) ──
  { code: "CompTIA A+", title: "CompTIA A+", level: "Beginner", tags: ["Infrastructure", "Modern Desktop"] },
  { code: "CompTIA Tech+", title: "CompTIA Tech+", level: "Beginner", tags: ["Infrastructure"] },
  { code: "CompTIA Project+", title: "CompTIA Project+", level: "Beginner", tags: ["Business"] },

  // ── Intermediate (Plus+ Series) ──
  { code: "CompTIA AutoOps+", title: "CompTIA AutoOps+", level: "Intermediate", tags: ["Infrastructure", "Cloud"] },
  { code: "CompTIA Data+", title: "CompTIA Data+", level: "Intermediate", tags: ["AI", "Business"] },
  { code: "CompTIA DataSys+", title: "CompTIA DataSys+", level: "Intermediate", tags: ["Infrastructure"] },
  { code: "CompTIA Linux+", title: "CompTIA Linux+", level: "Intermediate", tags: ["Infrastructure"] },
  { code: "CompTIA Network+", title: "CompTIA Network+", level: "Intermediate", tags: ["Networking"] },
  { code: "CompTIA Security+", title: "CompTIA Security+", level: "Intermediate", tags: ["Security"] },
  { code: "CompTIA Server+", title: "CompTIA Server+", level: "Intermediate", tags: ["Infrastructure"] },

  // ── Advanced (Expansion Series) ──
  { code: "CompTIA Cloud+", title: "CompTIA Cloud+", level: "Advanced", tags: ["Cloud", "Infrastructure"] },
  { code: "CompTIA CySA+", title: "CompTIA CySA+", level: "Advanced", tags: ["Security"] },
  { code: "CompTIA PenTest+", title: "CompTIA PenTest+", level: "Advanced", tags: ["Security"] },
  { code: "CompTIA SecAI+", title: "CompTIA SecAI+", level: "Advanced", tags: ["Security", "AI"] },
  { code: "CompTIA SecOT+", title: "CompTIA SecOT+", level: "Advanced", tags: ["Security", "Infrastructure"] },

  // ── Expert (Xpert Series) ──
  { code: "CompTIA CloudNetX", title: "CompTIA CloudNetX", level: "Advanced", tags: ["Cloud", "Networking"] },
  { code: "CompTIA DataAI", title: "CompTIA DataAI", level: "Advanced", tags: ["AI"] },
  { code: "CompTIA SecurityX", title: "CompTIA SecurityX", level: "Advanced", tags: ["Security"] },
];

async function main() {
  const { rows: existing } = await pool.query("SELECT code FROM courses");
  const normalize = (c) => c.replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").toUpperCase().trim();
  const existingSet = new Set(existing.map((r) => normalize(r.code)));

  let created = 0;
  let skipped = 0;

  for (const cert of certifications) {
    if (existingSet.has(normalize(cert.code))) {
      console.log(`SKIP  ${cert.code} (already exists)`);
      skipped++;
      continue;
    }

    const nextStart = new Date();
    nextStart.setMonth(nextStart.getMonth() + 1);

    await pool.query(
      `INSERT INTO courses (vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12)`,
      [
        "comptia",
        cert.code,
        cert.title,
        cert.level,
        cert.level === "Beginner" ? "5 days" : cert.level === "Intermediate" ? "5 days" : "5 days",
        0,
        30,
        "Hybrid",
        nextStart.toISOString().split("T")[0],
        `Prepare for the ${cert.code} certification exam.`,
        "",
        cert.tags,
      ]
    );

    console.log(`ADD   ${cert.code}`);
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
