const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat } = require('docx');

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY = "1B3A5C";
const TEAL = "00567A";
const LIGHT_TEAL = "E8F4F8";
const LIGHT_GRAY = "F5F5F5";
const MEDIUM_GRAY = "E0E0E0";
const DARK_TEXT = "1A1A1A";
const WHITE = "FFFFFF";
const AMBER = "D97706";
const GREEN = "059669";

// ─── Table helpers ────────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: MEDIUM_GRAY };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [
      new TextRun({ text, bold: true, color: WHITE, size: 18, font: "Arial" })
    ]})]
  });
}

function dataCell(text, width, shade) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: shade ? { fill: LIGHT_GRAY, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [
      new TextRun({ text, size: 17, font: "Arial", color: DARK_TEXT })
    ]})]
  });
}

function boldDataCell(text, width, shade) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: shade ? { fill: LIGHT_GRAY, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [
      new TextRun({ text, size: 17, font: "Arial", color: TEAL, bold: true })
    ]})]
  });
}

// ─── Heading helpers ──────────────────────────────────────────────────────────
function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 8 } },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: NAVY })]
  });
}

function subHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: TEAL })]
  });
}

function subSubHeading(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 21, font: "Arial", color: NAVY })]
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: DARK_TEXT })]
  });
}

function boldBodyText(text) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: DARK_TEXT, bold: true })]
  });
}

function mixedPara(runs) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: runs.map(r => new TextRun({ ...r, size: r.size || 20, font: "Arial", color: r.color || DARK_TEXT }))
  });
}

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
  },
  sections: [
    // ═══════════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 3600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "TEMPO ACADEMY", size: 52, bold: true, font: "Arial", color: NAVY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 12 } },
          children: [new TextRun({ text: "Competitive Intelligence & Strategic Positioning Report", size: 28, font: "Arial", color: TEAL })]
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Market Research | March 2026", size: 22, font: "Arial", color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, font: "Arial", color: AMBER, bold: true })]
        }),
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: MEDIUM_GRAY, space: 12 } },
          spacing: { before: 200 },
          children: [new TextRun({ text: "Prepared for Tempo Platform Leadership", size: 18, font: "Arial", color: "888888" })]
        }),
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN CONTENT
    // ═══════════════════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: TEAL, space: 4 } },
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Tempo Academy ", bold: true, size: 16, font: "Arial", color: NAVY }),
              new TextRun({ text: "| Competitive Intelligence Report", size: 16, font: "Arial", color: "888888" }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: MEDIUM_GRAY, space: 4 } },
            children: [
              new TextRun({ text: "Confidential | Page ", size: 16, font: "Arial", color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
            ]
          })]
        })
      },
      children: [

        // ─── EXECUTIVE SUMMARY ──────────────────────────────────────────────
        sectionHeading("EXECUTIVE SUMMARY"),

        bodyText("Tempo Academy operates in a $4.17 billion African e-learning market growing at 19.2% CAGR, projected to reach $23.5 billion by 2035. After researching 20+ competing platforms across Africa-focused, global LMS, and white-label academy providers, one conclusion is clear:"),

        new Paragraph({
          spacing: { before: 160, after: 160 },
          shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
          indent: { left: 360, right: 360 },
          children: [new TextRun({ text: "No platform combines a full HR suite with an embedded academy for external participants, built for Africa. This is Tempo\u2019s strongest moat.", size: 21, font: "Arial", color: NAVY, bold: true, italics: true })]
        }),

        bodyText("The closest competitor \u2014 African Management Institute (AMI) \u2014 has trained 100,000+ professionals across 39 countries but runs on dated infrastructure with no self-serve model. Global leaders like Docebo and Bridge charge $15,000\u2013$25,000/year minimum with zero Africa-specific features. The mid-market gap ($3,000\u2013$10,000/year) is wide open."),

        // ─── 1. COMPETITIVE LANDSCAPE ───────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("1. COMPETITIVE LANDSCAPE"),

        subHeading("1.1 Direct Competitor: African Management Institute (AMI)"),

        mixedPara([
          { text: "Overview: ", bold: true },
          { text: "Pan-African social enterprise founded 2014 in Nairobi. 100,000+ professionals trained across 39 countries. Partnered with Tony Elumelu Foundation, AABS, GBSN." }
        ]),

        boldBodyText("What they offer:"),
        ...[
          "Private branded 12-month Enterprise Academy (white-labelled)",
          "\u201CWinning Behaviours Diagnostic\u201D \u2014 proprietary org assessment tool",
          "7,000+ hours of video content, 3,000+ downloadable tools",
          "Learning Sprints (6 two-month sprints per year)",
          "Live Learning Labs with African business experts",
          "Mobile apps (iOS + Android) with offline capability",
          "7 African language support",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        mixedPara([
          { text: "Pricing: ", bold: true },
          { text: "Not public. Sales-led, custom quotes. 12-month commitment. Some programmes subsidized by development partners." }
        ]),

        boldBodyText("Key weaknesses Tempo can exploit:"),
        ...[
          "No self-serve or product-led growth \u2014 requires talking to sales",
          "No public product screenshots or interactive demo",
          "Platform appears built on older infrastructure (SmApply)",
          "No AI/automation capabilities mentioned",
          "No API/integration ecosystem (no HRIS, Slack, Teams connectors)",
          "Rigid 12-month commitment model",
          "No programme builder for customers \u2014 AMI designs all programmes",
          "Weak real-time analytics dashboards",
          "3.2/5 Glassdoor rating (52% recommend as employer)",
          "Content/services company with a platform, not a platform company",
        ].map(t => new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
          indent: { left: 360, right: 360 },
          children: [
            new TextRun({ text: "Lesson for Tempo: ", bold: true, size: 19, font: "Arial", color: NAVY }),
            new TextRun({ text: "AMI\u2019s \u201CWinning Behaviours Diagnostic\u201D is a brilliant sales wedge \u2014 a free/low-cost assessment that generates value before the sale. Consider building an \u201CAcademy Readiness Assessment\u201D as a lead generation mechanism.", size: 19, font: "Arial", color: NAVY }),
          ]
        }),

        // ─── 1.2 Global LMS Leaders ─────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        subHeading("1.2 Global LMS Leaders"),

        // Bridge
        subSubHeading("Bridge LMS (getbridge.com)"),
        ...[
          ["Positioning: ", "\u201CThe powerfully simple LMS and performance management platform\u201D"],
          ["Price: ", "Starting at $15,000/year, custom-quoted"],
          ["Strength: ", "Only platform merging LMS + performance management + 32,000-skill taxonomy"],
          ["Weakness: ", "No Africa focus, no white-label mobile app, minimal gamification"],
          ["Lesson: ", "Skills taxonomy with gap analysis is a powerful differentiator. Tempo already has performance management \u2014 bundling it with Academy is a natural advantage."],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true }, { text: value }])),

        // TalentLMS
        subSubHeading("TalentLMS (talentlms.com)"),
        ...[
          ["Positioning: ", "\u201CThe training platform built for success\u201D \u2014 70,000+ teams"],
          ["Price: ", "Free tier \u2192 $119/mo \u2192 $299/mo \u2192 $579/mo \u2192 Enterprise custom"],
          ["Strength: ", "Easiest setup, best SMB accessibility, native gamification (points/badges/leaderboards), full white-label with custom domain"],
          ["Weakness: ", "Shallow analytics, no performance management, no Africa pricing"],
          ["Lesson: ", "Their free tier and transparent pricing drive massive adoption. Consider a freemium academy tier."],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true }, { text: value }])),

        // Docebo
        subSubHeading("Docebo (docebo.com)"),
        ...[
          ["Positioning: ", "\u201CScale learning with AI\u201D \u2014 enterprise-grade"],
          ["Price: ", "Starting ~$25,000/year ($7-10/user/month at scale)"],
          ["Strength: ", "Best-in-class multi-tenant/multi-portal architecture, advanced AI personalization, 40+ language support, deepest gamification"],
          ["Weakness: ", "Highest price, complex admin, overkill for <500 learners, no Africa strategy"],
          ["Lesson: ", "Multi-tenant architecture is the gold standard. Tempo\u2019s dual-audience capability (HR + external participants) is architecturally similar."],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true }, { text: value }])),

        // 360Learning
        subSubHeading("360Learning (360learning.com)"),
        ...[
          ["Positioning: ", "\u201CAI-powered collaborative learning\u201D \u2014 decentralized content creation"],
          ["Price: ", "$8/user/month (Team) \u2192 custom Enterprise ($100K+/year)"],
          ["Strength: ", "Any employee can create courses, not just L&D; best social learning features"],
          ["Weakness: ", "Limited white-label, no multi-tenancy, no performance management"],
          ["Lesson: ", "Collaborative/peer authoring is powerful \u2014 letting facilitators create content directly."],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true }, { text: value }])),

        // Thinkific
        subSubHeading("Thinkific (thinkific.com)"),
        ...[
          ["Positioning: ", "\u201CCreate, market, and sell online courses\u201D \u2014 learning commerce"],
          ["Price: ", "$36/mo \u2192 $74/mo \u2192 $149/mo \u2192 $499/mo \u2192 Plus (custom)"],
          ["Strength: ", "Only platform with native course selling/e-commerce, zero transaction fees, community Spaces"],
          ["Weakness: ", "Not a corporate LMS, no compliance tracking, no gamification native"],
          ["Lesson: ", "If Tempo academies charge participants for enrollment, a commerce layer would be unique in Africa."],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true }, { text: value }])),

        // ─── 1.3 Africa-Focused Platforms ───────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        subHeading("1.3 Africa-Focused Platforms"),

        ...[
          ["ALX Africa", "250,000+ learners, 85,000+ graduates. AI, data science, cloud computing. Practical project-based learning. Gap: Tech skills only."],
          ["Andela Learning Community", "110,000+ learners across 100 countries. Community-driven peer learning. Google/Microsoft/Salesforce partnerships."],
          ["Moringa School", "Kenya, Rwanda, Ghana, expanding to Nigeria. 85% placement rate. WEF Technology Pioneer 2021."],
          ["FUEL Online (South Africa)", "24+ years in e-learning. Hardware kiosks for deskless workers. End-to-end LMS with ERP/HRMS integration."],
          ["VigiLearn (Nigeria)", "Low-bandwidth optimization, offline sync, microlearning (2-12 min modules). 150+ programs."],
          ["ICAP Training Solutions", "Financial services training (70+ banking courses). Gap: Outdated platform, no cohort-based learning."],
        ].map(([name, desc]) => {
          return [
            subSubHeading(name),
            bodyText(desc),
          ];
        }).flat(),

        // ─── 2. COMPARATIVE MATRIX ──────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("2. COMPARATIVE MATRIX"),

        (() => {
          const colW = [1600, 1100, 1200, 900, 900, 900, 900, 900, 1020];
          const headers = ["Platform", "Target", "Price", "White-Label", "Certs", "Gamification", "Analytics", "Africa", "HR Int."];
          const rows = [
            ["Tempo Academy", "Ent + SME", "TBD", "Yes", "PDF+HTML", "Full", "Advanced", "Yes", "Yes"],
            ["AMI", "Ent + SME", "Custom", "Yes", "Yes", "No", "Limited", "Yes", "No"],
            ["Bridge", "Enterprise", "$15K+/yr", "Basic", "Basic", "Minimal", "Good", "No", "Yes"],
            ["TalentLMS", "SMB-Mid", "$119-579/mo", "Full", "Custom", "Native", "Basic", "No", "No"],
            ["Docebo", "Enterprise", "$25K+/yr", "Best", "Pro", "Best", "Advanced", "No", "No"],
            ["360Learning", "Mid-Mkt", "$8/user/mo", "Limited", "Good", "Good", "Good", "No", "No"],
            ["Thinkific", "Creator/SMB", "$36-499/mo", "Plus only", "3rd-party", "3rd-party", "Basic", "No", "No"],
            ["ALX Africa", "Corporate", "Custom", "No", "Yes", "No", "Limited", "Yes", "No"],
          ];

          return new Table({
            width: { size: 9420, type: WidthType.DXA },
            columnWidths: colW,
            rows: [
              new TableRow({ children: headers.map((h, i) => headerCell(h, colW[i])) }),
              ...rows.map((row, ri) => new TableRow({
                children: row.map((cell, ci) => ci === 0 ? boldDataCell(cell, colW[ci], ri % 2 === 1) : dataCell(cell, colW[ci], ri % 2 === 1))
              }))
            ]
          });
        })(),

        // ─── 3. MARKET OPPORTUNITY ──────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("3. MARKET OPPORTUNITY"),

        subHeading("3.1 Market Size"),
        ...[
          "Africa e-learning market: $4.17 billion (2026) \u2192 $23.5 billion by 2035",
          "CAGR: 19.2% \u2014 fastest-growing region globally",
          "Middle East & Africa LMS market: $947 million (2024) \u2192 $3.1 billion by 2030",
          "500+ EdTech startups across the continent",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("3.2 Key Growth Drivers"),
        ...[
          "Mobile internet penetration accelerating across Sub-Saharan Africa",
          "Youth population (median age 19.7) entering workforce needs skills development",
          "Regulatory compliance requirements (SETA/B-BBEE in South Africa, AML/KYC in banking)",
          "Post-COVID acceptance of digital learning across traditional industries",
          "Pan-African trade integration (AfCFTA) requiring cross-border workforce development",
        ].map(t => new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("3.3 Underserved Segments"),
        ...[
          "Mid-market companies ($3K\u2013$10K/year budget) \u2014 too big for TalentLMS, too small for Docebo",
          "Francophone West/Central Africa \u2014 most platforms are English-first",
          "Deskless workers \u2014 field teams, retail staff, manufacturing workers",
          "External participant training \u2014 customer/partner education at African price points",
          "Financial services training \u2014 banks need cohort-based compliance training",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        // ─── 4. TEMPO'S COMPETITIVE ADVANTAGES ─────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("4. TEMPO\u2019S COMPETITIVE ADVANTAGES"),

        subHeading("4.1 Unique Differentiators"),
        bodyText("Things NO competitor offers:"),
        ...[
          "Academy embedded in HR platform \u2014 participants and employees in one system, no separate vendor",
          "Dual-audience from one platform \u2014 train internal employees AND external participants",
          "Full backend already built \u2014 22 DB tables, 14 API routes, gamification, webhooks, SCORM, i18n, custom domains, certificates, billing",
          "Performance management + Academy \u2014 only Bridge does this, at $15K+/year",
          "Africa-first pricing potential \u2014 can undercut Western platforms by 60\u201380%",
        ].map(t => new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("4.2 Where Tempo Already Wins"),
        ...[
          "Certificate PDF generation with branded templates",
          "Points + badges + leaderboard with auto-awarding criteria (on par with Docebo)",
          "Cohort management with at-risk participant detection (unique analytics)",
          "Email trigger automation (enrollment, reminders, certificate issued)",
          "SCORM 1.2 import support",
          "Custom domains with DNS verification",
          "Webhook system for integrations",
          "Multi-language content layer (i18n translation system built)",
          "Separate participant auth (external users never see HR platform)",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("4.3 Where Tempo Needs Improvement"),

        (() => {
          const colW = [2800, 2200, 1000, 3420];
          const headers = ["Gap", "Competitor Reference", "Priority", "Effort"];
          const rows = [
            ["Mobile native app (offline)", "AMI, TalentLMS, Docebo", "High", "Large \u2014 critical for African connectivity"],
            ["AI-powered content creation", "TalentLMS, 360Learning", "High", "Medium \u2014 AI course builder, quiz gen"],
            ["Collaborative course authoring", "360Learning", "Medium", "Medium \u2014 facilitators create content"],
            ["Course commerce/monetization", "Thinkific", "Medium", "Medium \u2014 paid enrollment via Stripe"],
            ["Diagnostic/assessment tool", "AMI (Winning Behaviours)", "Medium", "Medium \u2014 pre-training assessment"],
            ["Advanced reporting & export", "Docebo", "Medium", "Small \u2014 custom report builder"],
            ["Microlearning format", "VigiLearn", "Medium", "Small \u2014 2-12 min bite-sized lessons"],
            ["Compliance templates", "Paradiso LMS, SAP Litmos", "Low", "Small \u2014 SETA/B-BBEE, AML/KYC"],
            ["Skills taxonomy", "Bridge (32K skills)", "Low", "Large \u2014 skills mapped to roles"],
            ["Peer review assignments", "360Learning", "Low", "Small \u2014 learners review each other"],
          ];

          return new Table({
            width: { size: 9420, type: WidthType.DXA },
            columnWidths: colW,
            rows: [
              new TableRow({ children: headers.map((h, i) => headerCell(h, colW[i])) }),
              ...rows.map((row, ri) => new TableRow({
                children: row.map((cell, ci) => ci === 0 ? boldDataCell(cell, colW[ci], ri % 2 === 1) : dataCell(cell, colW[ci], ri % 2 === 1))
              }))
            ]
          });
        })(),

        // ─── 5. COPYWRITING & MESSAGING ─────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("5. COPYWRITING & MESSAGING RECOMMENDATIONS"),

        subHeading("5.1 Best Messaging from Competitors"),
        ...[
          ["AMI: ", "\u201CLearning that Powers Growth\u201D \u2014 outcome-focused"],
          ["ALX: ", "\u201CWe don\u2019t just teach theory \u2014 we deliver skills shaped by real-life projects\u201D"],
          ["FUEL: ", "\u201C24+ years delivering scalable e-learning across Africa\u201D \u2014 trust"],
          ["AcademyOcean: ", "\u201CSave up to 80% of time on onboarding and training\u201D \u2014 quantified"],
          ["Acadle: ", "\u201CLearning becomes seamless \u2014 access courses inside tools you already use\u201D"],
        ].map(([label, value]) => mixedPara([{ text: label, bold: true, color: TEAL }, { text: value }])),

        subHeading("5.2 Recommended Taglines for Tempo Academy"),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
          alignment: AlignmentType.CENTER,
          indent: { left: 360, right: 360 },
          children: [new TextRun({ text: "\u201CYour academy. Inside your HR platform. Built for Africa.\u201D", size: 26, font: "Arial", color: NAVY, bold: true, italics: true })]
        }),

        boldBodyText("Alternatives to test:"),
        ...[
          "\u201CTrain your team. Certify your ecosystem.\u201D",
          "\u201CThe academy that lives where your people already work.\u201D",
          "\u201CFrom onboarding to certification. One platform.\u201D",
          "\u201CBuilt for African bandwidth. Designed for African ambition.\u201D",
          "\u201CThe only HR platform with a built-in academy for Africa.\u201D",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("5.3 Key Messages by Audience"),

        subSubHeading("For HR Directors"),
        bodyText("\u201CStop juggling separate learning platforms. Tempo Academy lives inside the same platform where you manage payroll, performance, and people \u2014 with one login, unified analytics, and zero integration headaches.\u201D"),

        subSubHeading("For L&D Managers"),
        bodyText("\u201CLaunch a branded academy in minutes, not months. Create cohorts, assign courses, track completion, issue certificates \u2014 all without writing a single line of code or managing another vendor.\u201D"),

        subSubHeading("For CEOs/COOs"),
        bodyText("\u201CTrain 500 SME owners across 5 countries with branded certificates, automated email triggers, and real-time analytics. All from the platform you already use for your own team.\u201D"),

        subSubHeading("For External Participants"),
        bodyText("\u201CYour learning journey starts here. Access courses, join live sessions, submit assignments, earn certificates \u2014 all in one place, on any device.\u201D"),

        // ─── 6. STRATEGIC RECOMMENDATIONS ───────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("6. STRATEGIC RECOMMENDATIONS"),

        subHeading("6.1 Quick Wins (2\u20134 weeks)"),
        ...[
          "Add a public-facing academy landing page at theworktempo.com/academy with value proposition and \u201CRequest Demo\u201D CTA",
          "Create 3 pre-built academy templates (Financial Literacy, Leadership Development, Digital Skills) for instant deployment",
          "Add LinkedIn-shareable certificates with verification QR codes",
          "Build a \u201CProgramme Overview\u201D public page per academy for marketing",
        ].map(t => new Paragraph({ numbering: { reference: "numbers4", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("6.2 Medium-Term (1\u20133 months)"),
        ...[
          "AI-powered course builder \u2014 facilitators describe a module, AI generates outlines, quizzes, and briefs",
          "Mobile-responsive PWA with offline content caching",
          "Course commerce layer \u2014 paid enrollment via Stripe/Flutterwave/Paystack",
          "Academy Readiness Diagnostic \u2014 free assessment tool as sales wedge (AMI-inspired)",
          "Microlearning module format \u2014 2\u201312 minute bite-sized content units",
        ].map(t => new Paragraph({ numbering: { reference: "numbers5", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        subHeading("6.3 Long-Term (3\u20136 months)"),
        ...[
          "Native mobile app (iOS + Android) with offline sync",
          "Collaborative course authoring \u2014 SMEs and facilitators create content directly",
          "Skills taxonomy mapped to African job market roles",
          "Compliance template library (SETA/B-BBEE, AML/KYC, health & safety)",
          "Marketplace for sharing/selling academy templates between organizations",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 19, font: "Arial" })] })),

        // ─── 7. POSITIONING STATEMENT ───────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("7. COMPETITIVE POSITIONING STATEMENT"),

        new Paragraph({
          spacing: { before: 300, after: 300 },
          shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
          indent: { left: 360, right: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 12 } },
          children: [new TextRun({
            text: "\u201CTempo Academy is the first HR platform with a built-in learning academy designed for African enterprises. Unlike standalone LMS platforms that require separate contracts, integrations, and logins, Tempo Academy lives inside the same platform where you manage your people \u2014 connecting training directly to performance, compensation, and career development. With branded white-label academies, cohort-based learning, automated certifications, and multi-language support, Tempo enables organizations to train both their employees and external participants from a single system \u2014 at a price point built for Africa, not Silicon Valley.\u201D",
            size: 20, font: "Arial", color: NAVY, italics: true
          })]
        }),

        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: MEDIUM_GRAY, space: 12 } },
          spacing: { before: 200 },
          children: [new TextRun({ text: "End of Report", size: 18, font: "Arial", color: "999999", italics: true })]
        }),
      ]
    }
  ]
});

// ─── Generate ─────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  const outPath = "/Users/simonrey/tempo-platform/docs/Tempo Academy - Competitive Intelligence Report.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
});
