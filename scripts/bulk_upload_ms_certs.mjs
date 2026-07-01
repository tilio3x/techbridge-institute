import pg from "pg";
const { Pool } = pg;

const DATABASE_URL =
  "postgresql://postgredbadmin:l79ESuF2II8o@techbridge-db.postgres.database.azure.com:5432/postgres?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

const certifications = [
  // ── Cloud & AI Platforms — Fundamentals ──
  { code: "AZ-900", title: "Azure Fundamentals", level: "Beginner", tags: ["Microsoft Azure", "Cloud"] },
  { code: "AI-900", title: "Azure AI Fundamentals", level: "Beginner", tags: ["Microsoft Azure", "AI"] },
  { code: "AI-901", title: "Azure AI Fundamentals", level: "Beginner", tags: ["Microsoft Azure", "AI"] },
  { code: "DP-900", title: "Azure Data Fundamentals", level: "Beginner", tags: ["Microsoft Azure", "Cloud"] },

  // ── Cloud & AI Platforms — Role-Based ──
  { code: "AZ-104", title: "Azure Administrator Associate", level: "Intermediate", tags: ["Microsoft Azure", "Cloud", "Infrastructure"] },
  { code: "AZ-800", title: "Windows Server Hybrid Administrator Associate", level: "Intermediate", tags: ["Microsoft Azure", "Infrastructure"] },
  { code: "AZ-801", title: "Windows Server Hybrid Administrator Associate", level: "Intermediate", tags: ["Microsoft Azure", "Infrastructure"] },
  { code: "DP-300", title: "Azure Database Administrator Associate", level: "Intermediate", tags: ["Microsoft Azure", "Cloud"] },
  { code: "PL-300", title: "Power BI Data Analyst Associate", level: "Intermediate", tags: ["Power Platform", "AI"] },
  { code: "AZ-204", title: "Azure Developer Associate", level: "Intermediate", tags: ["Microsoft Azure", "Cloud"] },
  { code: "AI-102", title: "Azure AI Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "DP-600", title: "Fabric Analytics Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "AZ-305", title: "Azure Solutions Architect Expert", level: "Advanced", tags: ["Microsoft Azure", "Cloud", "Infrastructure"] },
  { code: "AI-103", title: "Azure AI Apps and Agents Developer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "DP-700", title: "Fabric Data Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "AZ-400", title: "DevOps Engineer Expert", level: "Advanced", tags: ["Microsoft Azure", "Cloud", "Infrastructure"] },
  { code: "AI-200", title: "Azure AI Cloud Developer Associate Certification", level: "Intermediate", tags: ["Microsoft Azure", "AI", "Cloud"] },
  { code: "DP-750", title: "Azure Databricks Data Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "AZ-700", title: "Azure Network Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "Networking"] },
  { code: "AI-300", title: "Machine Learning Operations Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },
  { code: "DP-800", title: "SQL AI Developer Associate", level: "Intermediate", tags: ["Microsoft Azure", "AI"] },

  // ── Cloud & AI Platforms — Specialty ──
  { code: "AZ-120", title: "Azure for SAP Workloads Specialty", level: "Advanced", tags: ["Microsoft Azure", "Cloud"] },
  { code: "DP-420", title: "Azure Cosmos DB Developer Specialty", level: "Advanced", tags: ["Microsoft Azure", "Cloud"] },
  { code: "AZ-140", title: "Azure Virtual Desktop Specialty", level: "Advanced", tags: ["Microsoft Azure", "Modern Desktop"] },

  // ── AI Business Solutions — Fundamentals ──
  { code: "AB-900", title: "Microsoft 365 Copilot and Agent Administration Fundamentals", level: "Beginner", tags: ["Microsoft 365", "AI"] },
  { code: "PL-900", title: "Power Platform Fundamentals", level: "Beginner", tags: ["Power Platform"] },

  // ── AI Business Solutions — Role-Based ──
  { code: "MD-102", title: "Endpoint Administrator Associate", level: "Intermediate", tags: ["Microsoft 365", "Modern Desktop"] },
  { code: "MS-102", title: "Microsoft 365 Administrator Expert", level: "Advanced", tags: ["Microsoft 365", "Infrastructure"] },
  { code: "MS-721", title: "Collaboration Communications Systems Engineer Associate", level: "Intermediate", tags: ["Microsoft 365"] },
  { code: "MS-700", title: "Teams Administrator Associate", level: "Intermediate", tags: ["Microsoft 365"] },
  { code: "MB-280", title: "Dynamics 365 Customer Experience Analyst Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-310", title: "Dynamics 365 Finance Functional Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-330", title: "Dynamics 365 Supply Chain Management Functional Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-335", title: "Dynamics 365 Supply Chain Management Functional Consultant Expert", level: "Advanced", tags: ["Dynamics 365", "Business"] },
  { code: "MB-230", title: "Dynamics 365 Customer Service Functional Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-500", title: "Dynamics 365 Finance and Operations Apps Developer Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-240", title: "Dynamics 365 Field Service Functional Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-700", title: "Dynamics 365 Finance and Operations Apps Solution Architect Expert", level: "Advanced", tags: ["Dynamics 365", "Business"] },
  { code: "MB-800", title: "Dynamics 365 Business Central Functional Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "MB-820", title: "Dynamics 365 Business Central Developer Associate", level: "Intermediate", tags: ["Dynamics 365", "Business"] },
  { code: "PL-200", title: "Power Platform Functional Consultant Associate", level: "Intermediate", tags: ["Power Platform"] },
  { code: "PL-400", title: "Power Platform Developer Associate", level: "Intermediate", tags: ["Power Platform"] },
  { code: "PL-500", title: "Power Automate RPA Developer Associate", level: "Intermediate", tags: ["Power Platform"] },
  { code: "PL-600", title: "Power Platform Solution Architect Expert", level: "Advanced", tags: ["Power Platform"] },
  { code: "AB-100", title: "Agentic AI Business Solutions Architect", level: "Advanced", tags: ["AI", "Business"] },
  { code: "AB-620", title: "AI Agent Builder Associate", level: "Intermediate", tags: ["AI", "Business"] },
  { code: "AB-210", title: "Dynamics 365 Sales AI Consultant Associate", level: "Intermediate", tags: ["Dynamics 365", "AI", "Business"] },
  { code: "AB-410", title: "Intelligent Applications Builder Associate", level: "Intermediate", tags: ["AI", "Power Platform"] },
  { code: "AB-250", title: "Dynamics 365 Contact Center AI Engineer Associate", level: "Intermediate", tags: ["Dynamics 365", "AI"] },

  // ── Security — Fundamentals ──
  { code: "SC-900", title: "Security, Compliance, and Identity Fundamentals", level: "Beginner", tags: ["Security"] },

  // ── Security — Role-Based ──
  { code: "AZ-500", title: "Azure Security Engineer Associate", level: "Intermediate", tags: ["Microsoft Azure", "Security"] },
  { code: "SC-401", title: "Information Security Administrator Associate", level: "Intermediate", tags: ["Security", "Microsoft 365"] },
  { code: "SC-100", title: "Cybersecurity Architect Expert", level: "Advanced", tags: ["Security"] },
  { code: "SC-200", title: "Security Operations Analyst Associate", level: "Intermediate", tags: ["Security"] },
  { code: "SC-300", title: "Identity and Access Administrator Associate", level: "Intermediate", tags: ["Security", "Microsoft 365"] },
  { code: "SC-500", title: "Cloud and AI Security Engineer Associate Certification", level: "Intermediate", tags: ["Security", "Cloud", "AI"] },
  { code: "SC-730", title: "Cybersecurity Business Professional Certification", level: "Intermediate", tags: ["Security", "Business"] },

  // ── Specialty — GitHub ──
  { code: "GH-900", title: "GitHub Foundations", level: "Beginner", tags: ["Cloud", "Infrastructure"] },
  { code: "GH-100", title: "GitHub Administration", level: "Intermediate", tags: ["Cloud", "Infrastructure"] },
  { code: "GH-200", title: "GitHub Actions", level: "Intermediate", tags: ["Cloud", "Infrastructure"] },
  { code: "GH-300", title: "GitHub Copilot", level: "Intermediate", tags: ["AI", "Cloud"] },
  { code: "GH-600", title: "GitHub Agentic AI Developer", level: "Intermediate", tags: ["AI", "Cloud"] },
  { code: "GH-500", title: "GitHub Advanced Security", level: "Advanced", tags: ["Security", "Cloud"] },

  // ── Business ──
  { code: "AB-730", title: "AI Business Professional", level: "Beginner", tags: ["AI", "Business"] },
  { code: "AB-731", title: "AI Transformation Leader", level: "Beginner", tags: ["AI", "Business"] },
];

async function main() {
  const { rows: existing } = await pool.query("SELECT code FROM courses");
  const normalize = (c) => c.replace(/\s*-\s*/g, "-").toUpperCase();
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
        "microsoft",
        cert.code,
        cert.title,
        cert.level,
        cert.level === "Beginner" ? "1 day" : cert.level === "Intermediate" ? "4 days" : "5 days",
        0,
        30,
        "Hybrid",
        nextStart.toISOString().split("T")[0],
        `Prepare for the Microsoft ${cert.code} certification exam.`,
        "",
        cert.tags,
      ]
    );

    console.log(`ADD   ${cert.code} — "${cert.title}"`);
    created++;
    existingSet.add(normalize(cert.code));
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Total in poster: ${certifications.length}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
