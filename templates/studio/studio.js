// studio.js - Pick Me Studio Visual Editor & Synchronizer

// SVG Icon Templates
const SVG_TRASH = `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
const SVG_PLUS = `<svg class="svg-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="4.5" x2="8" y2="11.5"/><line x1="4.5" y1="8" x2="11.5" y2="8"/></svg>`;
const SVG_CHEVRON = `<svg class="svg-icon summary-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

// State
const state = {
  path: "",
  filename: "document.typ",
  pdfPath: "",
  pdfUrl: "",
  rawTypst: "",
  mode: "form",
  parsed: null,
  zoom: 100,
  dirty: false
};

// DOM Elements
const elFileSelect = document.getElementById("file-select");
const elBtnUpload = document.getElementById("btn-upload");
const elFileUpload = document.getElementById("file-upload");
const elModeForm = document.getElementById("mode-form");
const elModeRaw = document.getElementById("mode-raw");
const elModePreview = document.getElementById("mode-preview");
const elStatusPill = document.getElementById("status-pill");
const elStatusText = document.getElementById("status-text");
const elExportMenu = document.getElementById("export-menu");
const elBtnExportToggle = document.getElementById("btn-export-toggle");
const elBtnDownloadPdf = document.getElementById("btn-download-pdf");
const elBtnDownloadTyp = document.getElementById("btn-download-typ");
const elBtnSave = document.getElementById("btn-save");
const elEditorContainer = document.getElementById("editor-container");
const elVisualContainer = document.getElementById("visual-container");
const elRawContainer = document.getElementById("raw-container");
const elRawTextarea = document.getElementById("raw-textarea");
const elErrorBanner = document.getElementById("error-banner");
const elBtnTheme = document.getElementById("btn-theme");
const elPdfFrame = document.getElementById("pdf-frame");

function setDirty(isDirty, msg = "") {
  state.dirty = isDirty;
  if (isDirty) {
    elStatusPill.className = "status dirty";
    elStatusText.textContent = msg || "Unsaved changes";
  } else {
    elStatusPill.className = "status";
    elStatusText.textContent = msg || "All changes saved";
  }
}

function setError(msg) {
  if (!msg) {
    elErrorBanner.style.display = "none";
    elErrorBanner.textContent = "";
  } else {
    elErrorBanner.style.display = "block";
    elErrorBanner.textContent = msg;
    elStatusPill.className = "status err";
    elStatusText.textContent = "Compile error";
  }
}

// =========================================================================
// Typst Delimiter & Structure Parsing Utilities
// =========================================================================
function findMatchingBracket(str, openIdx, openChar = "[", closeChar = "]") {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < str.length; i++) {
    const ch = str[i];
    const prev = i > 0 ? str[i - 1] : "";
    if (ch === '"' && prev !== "\\") {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractBalancedCalls(blockText, fnName) {
  const results = [];
  let searchPos = 0;
  const needle = "#" + fnName + "(";
  while (true) {
    const idx = blockText.indexOf(needle, searchPos);
    if (idx === -1) break;
    const openParen = idx + needle.length - 1;
    const closeParen = findMatchingBracket(blockText, openParen, "(", ")");
    if (closeParen === -1) break;
    const inner = blockText.slice(openParen + 1, closeParen);
    results.push({ start: idx, end: closeParen + 1, inner: inner });
    searchPos = closeParen + 1;
  }
  return results;
}

function parseNamedStringArg(inner, argName) {
  const strRe = new RegExp(argName + '\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"');
  const m = inner.match(strRe);
  if (m) return m[1].replace(/\\"/g, '"');

  const brRe = new RegExp(argName + '\\s*:\\s*\\[');
  const bm = inner.match(brRe);
  if (bm) {
    const openIdx = bm.index + bm[0].length - 1;
    const closeIdx = findMatchingBracket(inner, openIdx, "[", "]");
    if (closeIdx !== -1) {
      return inner.slice(openIdx + 1, closeIdx).trim();
    }
  }
  return "";
}

function parseBulletsTuple(inner) {
  const m = inner.match(/bullets\s*:\s*\(/);
  if (!m) return [];
  const openParen = m.index + m[0].length - 1;
  const closeParen = findMatchingBracket(inner, openParen, "(", ")");
  if (closeParen === -1) return [];
  const tupleBody = inner.slice(openParen + 1, closeParen);
  const bullets = [];
  let pos = 0;
  while (pos < tupleBody.length) {
    const openBr = tupleBody.indexOf("[", pos);
    if (openBr === -1) break;
    const closeBr = findMatchingBracket(tupleBody, openBr, "[", "]");
    if (closeBr === -1) break;
    bullets.push(tupleBody.slice(openBr + 1, closeBr).trim());
    pos = closeBr + 1;
  }
  return bullets;
}

// =========================================================================
// Contact Header Parser & Serializer
// =========================================================================
function parseResumeHeader(block) {
  let name = "";
  let title = "";
  let location = "";
  let email = "";
  let phone = "";
  let linkedinUrl = "";
  let linkedinLabel = "LinkedIn";
  let githubUrl = "";
  let githubLabel = "GitHub";
  let portfolioUrl = "";
  let portfolioLabel = "Portfolio";

  const textCalls = [];
  let pos = 0;
  while (true) {
    const tIdx = block.indexOf("#text(", pos);
    if (tIdx === -1) break;
    const parenClose = findMatchingBracket(block, tIdx + 5, "(", ")");
    if (parenClose === -1) break;
    const afterParen = block.slice(parenClose + 1);
    const bracketMatch = afterParen.match(/^\s*\[/);
    if (!bracketMatch) {
      pos = parenClose + 1;
      continue;
    }
    const openBr = parenClose + 1 + bracketMatch[0].indexOf("[");
    const closeBr = findMatchingBracket(block, openBr, "[", "]");
    if (closeBr === -1) break;

    const args = block.slice(tIdx + 6, parenClose);
    const inner = block.slice(openBr + 1, closeBr).trim();
    textCalls.push({ args, inner });
    pos = closeBr + 1;
  }

  function isContactCall(call) {
    const text = call.inner;
    return text.includes("#link(") ||
           text.includes("mailto:") ||
           text.includes("@") ||
           /\+?\d[\d\s-]{7,}/.test(text);
  }

  if (textCalls.length >= 1) {
    name = textCalls[0].inner.replace(/\\/g, "").trim();
  }

  if (textCalls.length === 2) {
    if (isContactCall(textCalls[1])) {
      parseContactRow(textCalls[1].inner);
    } else {
      title = textCalls[1].inner.replace(/\\/g, "").trim();
    }
  } else if (textCalls.length >= 3) {
    if (isContactCall(textCalls[1]) && !isContactCall(textCalls[2])) {
      parseContactRow(textCalls[1].inner);
      title = textCalls[2].inner.replace(/\\/g, "").trim();
    } else {
      title = textCalls[1].inner.replace(/\\/g, "").trim();
      parseContactRow(textCalls[2].inner);
    }
  }

  if (!name) {
    const nm = block.match(/#text\([^)]*\)\[([^\]]+)\]/);
    if (nm) name = nm[1].trim();
  }

  function parseContactRow(rowText) {
    const parts = rowText.split("|").map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const linkMatch = part.match(/#link\("([^"]+)"\)(?:\[([^\]]*)\])?/);
      if (linkMatch) {
        const url = linkMatch[1].trim();
        const label = linkMatch[2] ? linkMatch[2].trim() : "";
        if (url.startsWith("mailto:")) {
          email = url.replace(/^mailto:/, "");
        } else if (url.includes("linkedin.com") || label.toLowerCase().includes("linkedin")) {
          linkedinUrl = url;
          if (label) linkedinLabel = label;
        } else if (url.includes("github.com") || label.toLowerCase().includes("github")) {
          githubUrl = url;
          if (label) githubLabel = label;
        } else {
          portfolioUrl = url;
          if (label) portfolioLabel = label;
        }
      } else {
        const clean = part.replace(/\\@/g, "@").replace(/\\/g, "").trim();
        if (clean.includes("@") && !clean.includes(" ")) {
          if (!email) email = clean;
        } else if (/^[\+\d\s\-\(\)\.]{7,}$/.test(clean)) {
          if (!phone) phone = clean;
        } else if (clean.length > 2 && !clean.includes("http")) {
          if (!location) location = clean;
        }
      }
    }
  }

  return {
    rawBlock: block,
    name,
    title,
    location,
    email,
    phone,
    linkedinUrl,
    linkedinLabel,
    githubUrl,
    githubLabel,
    portfolioUrl,
    portfolioLabel
  };
}

function serializeHeader(h) {
  const parts = [];
  if (h.location) parts.push(h.location);
  if (h.email) {
    const userPart = h.email.split("@")[0];
    parts.push(`#link("mailto:${h.email}")[\\@${userPart}]`);
  }
  if (h.phone) parts.push(h.phone);
  if (h.linkedinUrl) parts.push(`#link("${h.linkedinUrl}")[${h.linkedinLabel || "LinkedIn"}]`);
  if (h.githubUrl) parts.push(`#link("${h.githubUrl}")[${h.githubLabel || "GitHub"}]`);
  if (h.portfolioUrl) parts.push(`#link("${h.portfolioUrl}")[${h.portfolioLabel || "Portfolio"}]`);

  const contactLine = parts.join(" | \n    ");

  return `// Header\n#align(center)[\n  #text(size: 16pt, weight: "bold")[${h.name}] \\\n  #v(0.5pt)\n  #text(size: 9.5pt, weight: "medium", fill: rgb("#374151"))[${h.title}] \\\n  #v(1.5pt)\n  #text(size: 8.2pt, fill: rgb("#4b5563"))[\n    ${contactLine}\n  ]\n]`;
}

// =========================================================================
// Education & Certifications Parsers & Serializers
// =========================================================================
function parseEducationSection(body) {
  const entries = [];
  const blockMatches = [];
  let pos = 0;
  while (true) {
    const bIdx = body.indexOf("#block(", pos);
    if (bIdx === -1) break;
    const parenClose = findMatchingBracket(body, bIdx + 6, "(", ")");
    if (parenClose === -1) break;
    const after = body.slice(parenClose + 1);
    const brM = after.match(/^\s*\[/);
    if (!brM) { pos = parenClose + 1; continue; }
    const openBr = parenClose + 1 + brM[0].indexOf("[");
    const closeBr = findMatchingBracket(body, openBr, "[", "]");
    if (closeBr === -1) break;
    blockMatches.push(body.slice(openBr + 1, closeBr));
    pos = closeBr + 1;
  }

  const rawBlocks = blockMatches.length > 0 ? blockMatches : [body];

  for (const block of rawBlocks) {
    let degree = "";
    let institution = "";
    let location = "";
    let date = "";
    const honors = [];

    const degMatch = block.match(/text\(weight:\s*"bold"\)\[#?([^\]]+)\]/);
    if (degMatch) {
      degree = degMatch[1].trim();
    }
    const instMatch = block.match(/---\s*#?([A-Za-z0-9\s,\.]+?)(?:\]|\n|$)/);
    if (instMatch) {
      institution = instMatch[1].trim().replace(/\]$/, "");
    }

    const dateMatch = block.match(/text\([^)]*size:\s*8\.[0-9]+pt[^)]*\)\[#?([^\]]+)\]/) ||
                      block.match(/\[([A-Za-z]{3,}\s+\d{4}\s*(?:--|-|–)\s*(?:[A-Za-z]{3,}\s+\d{4}|Present))\]/);
    if (dateMatch) {
      date = dateMatch[1].trim();
    }

    const locMatch = block.match(/style:\s*"italic"[^)]*\)\[#?([^\]]+)\]/) ||
                     block.match(/text\([^)]*italic[^)]*\)\[#?([^\]]+)\]/);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    const listIdx = block.indexOf("#list(");
    if (listIdx !== -1) {
      const pClose = findMatchingBracket(block, listIdx + 5, "(", ")");
      if (pClose !== -1) {
        const listBody = block.slice(listIdx + 6, pClose);
        let lPos = 0;
        while (lPos < listBody.length) {
          const ob = listBody.indexOf("[", lPos);
          if (ob === -1) break;
          const cb = findMatchingBracket(listBody, ob, "[", "]");
          if (cb === -1) break;
          const item = listBody.slice(ob + 1, cb).trim();
          if (item !== "•" && item !== "-" && item !== "*") {
            honors.push(item);
          }
          lPos = cb + 1;
        }
      }
    }

    if (degree || institution) {
      entries.push({ degree, institution, location, date, honors });
    }
  }

  if (entries.length === 0) {
    entries.push({
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Saint Louis Tuguegarao",
      location: "Tuguegarao City, Philippines",
      date: "Aug 2022 -- June 2026",
      honors: ["GWA: 94.42% (Cum Laude)"]
    });
  }

  return entries;
}

function serializeEducation(entries) {
  return entries.map(e => {
    let out = `#block(width: 100%, breakable: false)[\n`;
    out += `  #grid(\n`;
    out += `    columns: (1fr, auto),\n`;
    out += `    text(weight: "bold")[${e.degree}] + text(fill: rgb("#4b5563"))[ --- ${e.institution}],\n`;
    out += `    text(fill: rgb("#4b5563"), size: 8.3pt)[${e.date}],\n`;
    out += `  )\n`;
    if (e.location) {
      out += `  #v(-2.5pt)\n`;
      out += `  #text(size: 7.8pt, fill: rgb("#6b7280"), style: "italic")[${e.location}]\n`;
    }
    if (e.honors && e.honors.length > 0) {
      out += `  #v(0.5pt)\n`;
      out += `  #list(\n    marker: [•],\n    spacing: 2.2pt,\n`;
      out += e.honors.map(h => `    [${h}],`).join("\n") + "\n";
      out += `  )\n`;
    }
    out += `  #v(1.5pt)\n]`;
    return out;
  }).join("\n\n");
}

function parseCertificationsSection(body) {
  const certs = [];
  let pos = 0;
  while (pos < body.length) {
    const ob = body.indexOf("[", pos);
    if (ob === -1) break;
    const cb = findMatchingBracket(body, ob, "[", "]");
    if (cb === -1) break;
    const item = body.slice(ob + 1, cb).trim();
    if (item && item !== "•" && item !== "*" && !item.startsWith("columns:") && !item.startsWith("row-gutter:") && !item.startsWith("column-gutter:")) {
      let clean = item.replace(/^•\s*/, "").trim();
      let name = "";
      let issuer = "";
      let year = "";

      const boldM = clean.match(/^\*([^*]+)\*/);
      if (boldM) {
        name = boldM[1].trim();
        clean = clean.slice(boldM[0].length).trim();
      }

      const sepM = clean.match(/^(?:---|--|-)\s*(.*)$/);
      if (sepM) {
        clean = sepM[1].trim();
      }

      const yrM = clean.match(/\((\d{4})\)\s*$/);
      if (yrM) {
        year = yrM[1];
        clean = clean.slice(0, yrM.index).trim();
      }

      issuer = clean.replace(/---$/, "").trim();
      if (!name && clean) name = clean;

      if (name) {
        certs.push({ name, issuer, year });
      }
    }
    pos = cb + 1;
  }

  if (certs.length === 0) {
    certs.push(
      { name: "Associate Data Engineer in SQL", issuer: "DataCamp", year: "2026" },
      { name: "Associate Python Developer", issuer: "DataCamp", year: "2025" },
      { name: "Git for Beginners", issuer: "Udemy", year: "2025" }
    );
  }

  return certs;
}

function serializeCertifications(certs) {
  let out = `#grid(\n  columns: (1fr, 1fr),\n  column-gutter: 8pt,\n  row-gutter: 4pt,\n`;
  out += certs.map(c => `  [• *${c.name}* --- ${c.issuer}${c.year ? ` (${c.year})` : ""}],`).join("\n") + "\n";
  out += `)`;
  return out;
}

function parseSkillsGrid(body) {
  const rows = [];
  const pairRe = /\[\*([^*:\]]+):?\*\]\s*,\s*\[([^\]]*)\]/g;
  let m;
  while ((m = pairRe.exec(body)) !== null) {
    rows.push({
      category: m[1].trim(),
      skills: m[2].trim()
    });
  }
  return rows;
}

function serializeSkillsGrid(rows) {
  let out = `#grid(\n  columns: (auto, 1fr),\n  column-gutter: 8pt,\n  row-gutter: 3pt,\n`;
  out += rows.map(r => `  [*${r.category}:*], [${r.skills}],`).join("\n") + "\n";
  out += `)`;
  return out;
}

// =========================================================================
// Document Parser & Serializer Orchestration
// =========================================================================
function detectDocType(typ) {
  if (typ.includes("#let exp-entry") || typ.includes('#section-title(')) {
    return "resume";
  }
  if (typ.includes("Dear ") && typ.includes("Sincerely")) {
    return "cover-letter";
  }
  return "generic";
}

function parseResume(typ) {
  const sectionRe = /(?:\r?\n\/\/[^\r\n]*)?\r?\n#section-title\("([^"]+)"\)\r?\n?/g;
  const matches = [...typ.matchAll(sectionRe)];
  if (matches.length === 0) {
    return { kind: "generic", raw: typ };
  }

  const preHeaderAndHeader = typ.slice(0, matches[0].index);
  const alignMatch = preHeaderAndHeader.match(/#align\(center\)\s*\[/);
  let stylePreamble = preHeaderAndHeader;
  let headerBlock = "";

  if (alignMatch) {
    const alignIdx = alignMatch.index;
    const commentIdx = preHeaderAndHeader.lastIndexOf("// Header", alignIdx);
    const splitAt = commentIdx !== -1 ? commentIdx : alignIdx;
    stylePreamble = preHeaderAndHeader.slice(0, splitAt).trimEnd();
    headerBlock = preHeaderAndHeader.slice(splitAt).trim();
  } else {
    const textMatch = preHeaderAndHeader.match(/#text\([^)]*weight:\s*"bold"[^)]*\)\[/);
    if (textMatch) {
      const tIdx = textMatch.index;
      const commentIdx = preHeaderAndHeader.lastIndexOf("// Header", tIdx);
      const splitAt = commentIdx !== -1 ? commentIdx : tIdx;
      stylePreamble = preHeaderAndHeader.slice(0, splitAt).trimEnd();
      headerBlock = preHeaderAndHeader.slice(splitAt).trim();
    }
  }

  const header = parseResumeHeader(headerBlock);
  const sections = [];

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1];
    const bodyStart = matches[i].index + matches[i][0].length;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : typ.length;
    const body = typ.slice(bodyStart, bodyEnd).trim();
    const titleLower = title.toLowerCase();

    if (body.includes("#grid(") && body.includes("[*")) {
      sections.push({
        title,
        type: "skills-grid",
        rows: parseSkillsGrid(body),
        rawBody: body
      });
    } else if (body.includes("#exp-entry(") || body === "EXPERIENCE_BLOCK_PLACEHOLDER") {
      const parsedEntries = extractBalancedCalls(body, "exp-entry").map(c => ({
        title: parseNamedStringArg(c.inner, "title"),
        company: parseNamedStringArg(c.inner, "company"),
        location: parseNamedStringArg(c.inner, "location"),
        date: parseNamedStringArg(c.inner, "date"),
        bullets: parseBulletsTuple(c.inner)
      }));
      sections.push({
        title,
        type: "exp-list",
        entries: parsedEntries.length > 0 ? parsedEntries : [{
          title: "Application Developer Intern",
          company: "NOAH Business Applications",
          location: "Makati City, Metro Manila, Philippines",
          date: "June 2025 -- July 2025",
          bullets: ["Tested system components scheduled for deployment within SIT environments."]
        }]
      });
    } else if (body.includes("#project-entry(") || body === "PROJECTS_BLOCK_PLACEHOLDER") {
      const parsedProjects = extractBalancedCalls(body, "project-entry").map(c => ({
        name: parseNamedStringArg(c.inner, "name"),
        stack: parseNamedStringArg(c.inner, "stack"),
        date: parseNamedStringArg(c.inner, "date"),
        bullets: parseBulletsTuple(c.inner)
      }));
      sections.push({
        title,
        type: "project-list",
        entries: parsedProjects.length > 0 ? parsedProjects : [{
          name: "Sample Project",
          stack: "Python, SQL, dbt",
          date: "2026",
          bullets: ["Built modular ELT pipeline and automated schema tests."]
        }]
      });
    } else if (titleLower.includes("education") || body.includes("Bachelor") || body.includes("University") || body === "EDUCATION_BLOCK_PLACEHOLDER") {
      sections.push({
        title,
        type: "education",
        entries: parseEducationSection(body)
      });
    } else if (titleLower.includes("certification") || titleLower.includes("training") || body === "CERTIFICATIONS_BLOCK_PLACEHOLDER") {
      sections.push({
        title,
        type: "certifications",
        entries: parseCertificationsSection(body)
      });
    } else {
      sections.push({
        title,
        type: "text-block",
        content: body
      });
    }
  }

  return {
    kind: "resume",
    stylePreamble,
    header,
    sections
  };
}

function serializeResume(parsed) {
  const headerTyp = serializeHeader(parsed.header);
  const secStrings = parsed.sections.map(sec => {
    const heading = `#section-title("${sec.title}")`;
    if (sec.type === "skills-grid") {
      return `${heading}\n${serializeSkillsGrid(sec.rows)}`;
    }
    if (sec.type === "exp-list") {
      const entriesTyp = sec.entries.map(e => {
        const bulletsTyp = (e.bullets || []).map(b => `[${b}]`).join(",\n    ");
        let out = `#exp-entry(\n  title: "${e.title || ""}",\n  company: "${e.company || ""}",`;
        if (e.location) out += `\n  location: "${e.location}",`;
        out += `\n  date: "${e.date || ""}",\n  bullets: (\n    ${bulletsTyp}\n  )\n)`;
        return out;
      }).join("\n\n");
      return `${heading}\n${entriesTyp}`;
    }
    if (sec.type === "project-list") {
      const projsTyp = sec.entries.map(p => {
        const bulletsTyp = (p.bullets || []).map(b => `[${b}]`).join(",\n    ");
        let out = `#project-entry(\n  name: "${p.name || ""}",`;
        if (p.stack) out += `\n  stack: "${p.stack}",`;
        out += `\n  date: "${p.date || ""}",\n  bullets: (\n    ${bulletsTyp}\n  )\n)`;
        return out;
      }).join("\n\n");
      return `${heading}\n${projsTyp}`;
    }
    if (sec.type === "education") {
      return `${heading}\n${serializeEducation(sec.entries)}`;
    }
    if (sec.type === "certifications") {
      return `${heading}\n${serializeCertifications(sec.entries)}`;
    }
    return `${heading}\n${sec.content}`;
  });

  return `${parsed.stylePreamble}\n\n${headerTyp}\n\n${secStrings.join("\n\n")}\n`;
}

// Cover Letter Parser & Serializer
function parseCoverLetter(typ) {
  const dearMatch = typ.match(/\r?\n(Dear [^\r\n]+)\r?\n/);
  const sincerelyMatch = typ.match(/\r?\n(#v\(\d+pt\)\r?\n)?Sincerely,/);
  if (!dearMatch || !sincerelyMatch) {
    return { kind: "generic", raw: typ };
  }

  const preSalutation = typ.slice(0, dearMatch.index).trimEnd();
  const salutation = dearMatch[1].trim();
  const bodyStart = dearMatch.index + dearMatch[0].length;
  const bodyEnd = sincerelyMatch.index;
  const rawBody = typ.slice(bodyStart, bodyEnd).trim();
  const postBody = typ.slice(sincerelyMatch.index).trim();

  const paragraphs = rawBody
    .split(/(?:\r?\n)+\s*#v\(\d+pt\)\s*(?:\r?\n)+|(?:\r?\n){2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  let topHeader = preSalutation;
  let dateStr = "";
  let recipientBlock = "";
  const dateMarker = "// Date & Recipient";
  const dmIdx = preSalutation.indexOf(dateMarker);
  if (dmIdx !== -1) {
    topHeader = preSalutation.slice(0, dmIdx).trimEnd();
    const afterDate = preSalutation.slice(dmIdx + dateMarker.length).trim();
    const vParts = afterDate.split(/#v\(\d+(?:\.\d+)?pt\)/);
    dateStr = (vParts[0] || "").trim();
    recipientBlock = (vParts.slice(1).join("\n\n") || "").trim();
  }

  const header = parseResumeHeader(topHeader);

  return {
    kind: "cover-letter",
    topHeader,
    header,
    hasDateMarker: dmIdx !== -1,
    dateStr,
    recipientBlock,
    salutation,
    paragraphs,
    postBody
  };
}

function serializeCoverLetter(parsed) {
  let pre = parsed.topHeader;
  if (parsed.header && parsed.header.name) {
    pre = serializeHeader(parsed.header);
  }
  if (parsed.hasDateMarker) {
    pre += `\n\n// Date & Recipient\n${parsed.dateStr}\n\n#v(8pt)\n${parsed.recipientBlock}\n\n#v(14pt)`;
  }
  const bodyJoined = parsed.paragraphs.join("\n\n#v(10pt)\n");
  return `${pre}\n\n${parsed.salutation}\n\n${bodyJoined}\n\n${parsed.postBody}\n`;
}

// =========================================================================
// Visual Form Rendering
// =========================================================================
function syncVisualToRaw() {
  if (!state.parsed) return;
  if (state.parsed.kind === "resume") {
    state.rawTypst = serializeResume(state.parsed);
  } else if (state.parsed.kind === "cover-letter") {
    state.rawTypst = serializeCoverLetter(state.parsed);
  } else {
    state.rawTypst = state.parsed.raw;
  }
  elRawTextarea.value = state.rawTypst;
  setDirty(true);
}

function renderVisualEditor() {
  try {
    elVisualContainer.innerHTML = "";
    const docType = detectDocType(state.rawTypst);

    if (docType === "resume") {
      state.parsed = parseResume(state.rawTypst);
      renderResumeForm(state.parsed);
    } else if (docType === "cover-letter") {
      state.parsed = parseCoverLetter(state.rawTypst);
      renderCoverLetterForm(state.parsed);
    } else {
      state.parsed = { kind: "generic", raw: state.rawTypst };
      renderGenericForm(state.parsed);
    }
  } catch (err) {
    console.warn("Structured render failed, falling back to generic view:", err);
    state.parsed = { kind: "generic", raw: state.rawTypst };
    renderGenericForm(state.parsed);
  }
}

function createField(label, value, onInput, multiline = false) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  wrap.appendChild(lbl);

  const input = document.createElement(multiline ? "textarea" : "input");
  if (!multiline) input.type = "text";
  input.value = value || "";
  input.addEventListener("input", () => {
    onInput(input.value);
    syncVisualToRaw();
  });
  wrap.appendChild(input);
  return wrap;
}

function renderResumeForm(parsed) {
  // 1. Contact Section
  const secContact = document.createElement("details");
  secContact.className = "sec";
  secContact.open = true;
  secContact.innerHTML = `
    <summary>
      <span class="summary-left">Contact &amp; Header</span>
      ${SVG_CHEVRON}
    </summary>
    <div class="sec-body"></div>
  `;
  const cBody = secContact.querySelector(".sec-body");

  const row1 = document.createElement("div");
  row1.className = "grid-2";
  row1.appendChild(createField("Full Name", parsed.header.name, v => parsed.header.name = v));
  row1.appendChild(createField("Target Role / Title", parsed.header.title, v => parsed.header.title = v));
  cBody.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "grid-2";
  row2.appendChild(createField("Location", parsed.header.location, v => parsed.header.location = v));
  row2.appendChild(createField("Email Address", parsed.header.email, v => parsed.header.email = v));
  cBody.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "grid-2";
  row3.appendChild(createField("Phone Number", parsed.header.phone, v => parsed.header.phone = v));
  row3.appendChild(createField("Portfolio Website", parsed.header.portfolioUrl, v => parsed.header.portfolioUrl = v));
  cBody.appendChild(row3);

  const row4 = document.createElement("div");
  row4.className = "grid-2";
  row4.appendChild(createField("LinkedIn URL", parsed.header.linkedinUrl, v => parsed.header.linkedinUrl = v));
  row4.appendChild(createField("GitHub URL", parsed.header.githubUrl, v => parsed.header.githubUrl = v));
  cBody.appendChild(row4);

  elVisualContainer.appendChild(secContact);

  // 2. Dynamic Sections
  parsed.sections.forEach((sec, sIdx) => {
    const details = document.createElement("details");
    details.className = "sec";
    details.open = true;
    details.innerHTML = `
      <summary>
        <span class="summary-left">${sec.title}</span>
        ${SVG_CHEVRON}
      </summary>
      <div class="sec-body"></div>
    `;
    const sBody = details.querySelector(".sec-body");

    if (sec.type === "skills-grid") {
      const box = document.createElement("div");
      box.className = "skills-box";
      sec.rows.forEach((row, rIdx) => {
        const rDiv = document.createElement("div");
        rDiv.className = "skill-row";

        const catIn = document.createElement("input");
        catIn.type = "text";
        catIn.className = "cat-input";
        catIn.value = row.category;
        catIn.placeholder = "Category";
        catIn.oninput = () => { row.category = catIn.value; syncVisualToRaw(); };

        const valIn = document.createElement("input");
        valIn.type = "text";
        valIn.className = "val-input";
        valIn.value = row.skills;
        valIn.placeholder = "Comma-separated skills";
        valIn.oninput = () => { row.skills = valIn.value; syncVisualToRaw(); };

        const delBtn = document.createElement("button");
        delBtn.className = "btn-icon-only";
        delBtn.title = "Remove skill category";
        delBtn.innerHTML = SVG_TRASH;
        delBtn.onclick = () => {
          sec.rows.splice(rIdx, 1);
          syncVisualToRaw();
          renderVisualEditor();
        };

        rDiv.appendChild(catIn);
        rDiv.appendChild(valIn);
        rDiv.appendChild(delBtn);
        box.appendChild(rDiv);
      });
      sBody.appendChild(box);

      const addBtn = document.createElement("button");
      addBtn.className = "btn add-btn";
      addBtn.innerHTML = `${SVG_PLUS}<span>Add category</span>`;
      addBtn.onclick = () => {
        sec.rows.push({ category: "New Category", skills: "" });
        syncVisualToRaw();
        renderVisualEditor();
      };
      sBody.appendChild(addBtn);

    } else if (sec.type === "exp-list") {
      sec.entries.forEach((entry, eIdx) => {
        const card = document.createElement("div");
        card.className = "entity-card";

        const eh = document.createElement("div");
        eh.className = "entity-header";
        const title = document.createElement("span");
        title.className = "entity-title";
        title.textContent = `${entry.company || "Role"} - ${entry.title || ""}`;
        const delRoleBtn = document.createElement("button");
        delRoleBtn.className = "btn-icon-only";
        delRoleBtn.title = "Remove role";
        delRoleBtn.innerHTML = SVG_TRASH;
        delRoleBtn.onclick = () => {
          sec.entries.splice(eIdx, 1);
          syncVisualToRaw();
          renderVisualEditor();
        };
        eh.appendChild(title);
        eh.appendChild(delRoleBtn);
        card.appendChild(eh);

        const r1 = document.createElement("div");
        r1.className = "grid-2";
        r1.appendChild(createField("Role Title", entry.title, v => { entry.title = v; title.textContent = `${entry.company || "Role"} - ${entry.title || ""}`; }));
        r1.appendChild(createField("Company", entry.company, v => { entry.company = v; title.textContent = `${entry.company || "Role"} - ${entry.title || ""}`; }));
        card.appendChild(r1);

        const r2 = document.createElement("div");
        r2.className = "grid-2";
        r2.appendChild(createField("Location", entry.location, v => entry.location = v));
        r2.appendChild(createField("Date Range", entry.date, v => entry.date = v));
        card.appendChild(r2);

        const bList = document.createElement("div");
        bList.className = "bullet-list";
        (entry.bullets || []).forEach((bText, bIdx) => {
          const bRow = document.createElement("div");
          bRow.className = "bullet-row";
          const bArea = document.createElement("textarea");
          bArea.value = bText;
          bArea.placeholder = "Responsibility or achievement highlight";
          bArea.oninput = () => { entry.bullets[bIdx] = bArea.value; syncVisualToRaw(); };

          const bDel = document.createElement("button");
          bDel.className = "btn-icon-only";
          bDel.title = "Remove highlight";
          bDel.innerHTML = SVG_TRASH;
          bDel.onclick = () => {
            entry.bullets.splice(bIdx, 1);
            syncVisualToRaw();
            renderVisualEditor();
          };

          bRow.appendChild(bArea);
          bRow.appendChild(bDel);
          bList.appendChild(bRow);
        });
        card.appendChild(bList);

        const addB = document.createElement("button");
        addB.className = "bullet-add-btn";
        addB.innerHTML = `${SVG_PLUS}<span>Add highlight</span>`;
        addB.onclick = () => {
          if (!entry.bullets) entry.bullets = [];
          entry.bullets.push("");
          syncVisualToRaw();
          renderVisualEditor();
        };
        card.appendChild(addB);

        sBody.appendChild(card);
      });

      const addRoleBtn = document.createElement("button");
      addRoleBtn.className = "btn add-btn";
      addRoleBtn.innerHTML = `${SVG_PLUS}<span>Add role</span>`;
      addRoleBtn.onclick = () => {
        sec.entries.push({
          title: "Role Title",
          company: "Company",
          location: "Location",
          date: "2025 -- Present",
          bullets: ["Verified system reliability and core components."]
        });
        syncVisualToRaw();
        renderVisualEditor();
      };
      sBody.appendChild(addRoleBtn);

    } else if (sec.type === "project-list") {
      sec.entries.forEach((proj, pIdx) => {
        const card = document.createElement("div");
        card.className = "entity-card";

        const eh = document.createElement("div");
        eh.className = "entity-header";
        const title = document.createElement("span");
        title.className = "entity-title";
        title.textContent = proj.name || "Project";
        const delProjBtn = document.createElement("button");
        delProjBtn.className = "btn-icon-only";
        delProjBtn.title = "Remove project";
        delProjBtn.innerHTML = SVG_TRASH;
        delProjBtn.onclick = () => {
          sec.entries.splice(pIdx, 1);
          syncVisualToRaw();
          renderVisualEditor();
        };
        eh.appendChild(title);
        eh.appendChild(delProjBtn);
        card.appendChild(eh);

        const r1 = document.createElement("div");
        r1.className = "grid-2";
        r1.appendChild(createField("Project Name", proj.name, v => { proj.name = v; title.textContent = v || "Project"; }));
        r1.appendChild(createField("Tech Stack", proj.stack, v => proj.stack = v));
        card.appendChild(r1);

        const r2 = document.createElement("div");
        r2.className = "field";
        r2.appendChild(createField("Date Range", proj.date, v => proj.date = v));
        card.appendChild(r2);

        const bList = document.createElement("div");
        bList.className = "bullet-list";
        (proj.bullets || []).forEach((bText, bIdx) => {
          const bRow = document.createElement("div");
          bRow.className = "bullet-row";
          const bArea = document.createElement("textarea");
          bArea.value = bText;
          bArea.placeholder = "Technical project outcome or implementation detail";
          bArea.oninput = () => { proj.bullets[bIdx] = bArea.value; syncVisualToRaw(); };

          const bDel = document.createElement("button");
          bDel.className = "btn-icon-only";
          bDel.title = "Remove project bullet";
          bDel.innerHTML = SVG_TRASH;
          bDel.onclick = () => {
            proj.bullets.splice(bIdx, 1);
            syncVisualToRaw();
            renderVisualEditor();
          };

          bRow.appendChild(bArea);
          bRow.appendChild(bDel);
          bList.appendChild(bRow);
        });
        card.appendChild(bList);

        const addB = document.createElement("button");
        addB.className = "bullet-add-btn";
        addB.innerHTML = `${SVG_PLUS}<span>Add project bullet</span>`;
        addB.onclick = () => {
          if (!proj.bullets) proj.bullets = [];
          proj.bullets.push("");
          syncVisualToRaw();
          renderVisualEditor();
        };
        card.appendChild(addB);

        sBody.appendChild(card);
      });

      const addProjBtn = document.createElement("button");
      addProjBtn.className = "btn add-btn";
      addProjBtn.innerHTML = `${SVG_PLUS}<span>Add project</span>`;
      addProjBtn.onclick = () => {
        sec.entries.push({
          name: "Project Name",
          stack: "Python, SQL",
          date: "2026",
          bullets: ["Engineered scalable architecture with automated testing."]
        });
        syncVisualToRaw();
        renderVisualEditor();
      };
      sBody.appendChild(addProjBtn);

    } else if (sec.type === "education") {
      sec.entries.forEach((edu, eIdx) => {
        const card = document.createElement("div");
        card.className = "entity-card";

        const eh = document.createElement("div");
        eh.className = "entity-header";
        const title = document.createElement("span");
        title.className = "entity-title";
        title.textContent = `${edu.degree || "Degree"} - ${edu.institution || ""}`;
        const delEduBtn = document.createElement("button");
        delEduBtn.className = "btn-icon-only";
        delEduBtn.title = "Remove education";
        delEduBtn.innerHTML = SVG_TRASH;
        delEduBtn.onclick = () => {
          sec.entries.splice(eIdx, 1);
          syncVisualToRaw();
          renderVisualEditor();
        };
        eh.appendChild(title);
        eh.appendChild(delEduBtn);
        card.appendChild(eh);

        const r1 = document.createElement("div");
        r1.className = "grid-2";
        r1.appendChild(createField("Degree / Qualification", edu.degree, v => { edu.degree = v; title.textContent = `${edu.degree || "Degree"} - ${edu.institution || ""}`; }));
        r1.appendChild(createField("Institution / University", edu.institution, v => { edu.institution = v; title.textContent = `${edu.degree || "Degree"} - ${edu.institution || ""}`; }));
        card.appendChild(r1);

        const r2 = document.createElement("div");
        r2.className = "grid-2";
        r2.appendChild(createField("Location", edu.location, v => edu.location = v));
        r2.appendChild(createField("Date / Graduation Year", edu.date, v => edu.date = v));
        card.appendChild(r2);

        const bList = document.createElement("div");
        bList.className = "bullet-list";
        (edu.honors || []).forEach((hText, hIdx) => {
          const bRow = document.createElement("div");
          bRow.className = "bullet-row";
          const bArea = document.createElement("textarea");
          bArea.value = hText;
          bArea.placeholder = "Honors, GWA, or academic achievement";
          bArea.oninput = () => { edu.honors[hIdx] = bArea.value; syncVisualToRaw(); };

          const bDel = document.createElement("button");
          bDel.className = "btn-icon-only";
          bDel.title = "Remove honor highlight";
          bDel.innerHTML = SVG_TRASH;
          bDel.onclick = () => {
            edu.honors.splice(hIdx, 1);
            syncVisualToRaw();
            renderVisualEditor();
          };

          bRow.appendChild(bArea);
          bRow.appendChild(bDel);
          bList.appendChild(bRow);
        });
        card.appendChild(bList);

        const addHonorBtn = document.createElement("button");
        addHonorBtn.className = "bullet-add-btn";
        addHonorBtn.innerHTML = `${SVG_PLUS}<span>Add honor highlight</span>`;
        addHonorBtn.onclick = () => {
          if (!edu.honors) edu.honors = [];
          edu.honors.push("");
          syncVisualToRaw();
          renderVisualEditor();
        };
        card.appendChild(addHonorBtn);

        sBody.appendChild(card);
      });

      const addEduBtn = document.createElement("button");
      addEduBtn.className = "btn add-btn";
      addEduBtn.innerHTML = `${SVG_PLUS}<span>Add education</span>`;
      addEduBtn.onclick = () => {
        sec.entries.push({
          degree: "Degree / Program",
          institution: "University",
          location: "Location",
          date: "2026",
          honors: []
        });
        syncVisualToRaw();
        renderVisualEditor();
      };
      sBody.appendChild(addEduBtn);

    } else if (sec.type === "certifications") {
      const box = document.createElement("div");
      box.className = "certs-box";
      sec.entries.forEach((cert, cIdx) => {
        const cRow = document.createElement("div");
        cRow.className = "cert-row";

        const nameIn = document.createElement("input");
        nameIn.type = "text";
        nameIn.value = cert.name;
        nameIn.placeholder = "Certification Title";
        nameIn.oninput = () => { cert.name = nameIn.value; syncVisualToRaw(); };

        const issuerIn = document.createElement("input");
        issuerIn.type = "text";
        issuerIn.value = cert.issuer;
        issuerIn.placeholder = "Issuer (e.g. DataCamp)";
        issuerIn.oninput = () => { cert.issuer = issuerIn.value; syncVisualToRaw(); };

        const yearIn = document.createElement("input");
        yearIn.type = "text";
        yearIn.value = cert.year;
        yearIn.placeholder = "Year";
        yearIn.oninput = () => { cert.year = yearIn.value; syncVisualToRaw(); };

        const delCert = document.createElement("button");
        delCert.className = "btn-icon-only cert-del";
        delCert.title = "Remove certification";
        delCert.innerHTML = SVG_TRASH;
        delCert.onclick = () => {
          sec.entries.splice(cIdx, 1);
          syncVisualToRaw();
          renderVisualEditor();
        };

        cRow.appendChild(nameIn);
        cRow.appendChild(issuerIn);
        cRow.appendChild(yearIn);
        cRow.appendChild(delCert);
        box.appendChild(cRow);
      });
      sBody.appendChild(box);

      const addCertBtn = document.createElement("button");
      addCertBtn.className = "btn add-btn";
      addCertBtn.innerHTML = `${SVG_PLUS}<span>Add certification</span>`;
      addCertBtn.onclick = () => {
        sec.entries.push({ name: "New Certification", issuer: "Issuer", year: "" });
        syncVisualToRaw();
        renderVisualEditor();
      };
      sBody.appendChild(addCertBtn);

    } else {
      // Professional Summary / Free-form text block
      const field = document.createElement("div");
      field.className = "field";
      const area = document.createElement("textarea");
      area.className = "summary-textarea";
      area.style.minHeight = "96px";
      area.value = sec.content;
      area.setAttribute("aria-label", sec.title || "Section content");
      area.oninput = () => { sec.content = area.value; syncVisualToRaw(); };
      field.appendChild(area);
      sBody.appendChild(field);
    }

    elVisualContainer.appendChild(details);
  });
}

function renderCoverLetterForm(parsed) {
  if (parsed.header && (parsed.header.name || parsed.header.title || parsed.header.email)) {
    const secContact = document.createElement("details");
    secContact.className = "sec";
    secContact.open = true;
    secContact.innerHTML = `
      <summary>
        <span class="summary-left">Contact &amp; Header</span>
        ${SVG_CHEVRON}
      </summary>
      <div class="sec-body"></div>
    `;
    const cBody = secContact.querySelector(".sec-body");

    const row1 = document.createElement("div");
    row1.className = "grid-2";
    row1.appendChild(createField("Full Name", parsed.header.name, v => parsed.header.name = v));
    row1.appendChild(createField("Target Role / Title", parsed.header.title, v => parsed.header.title = v));
    cBody.appendChild(row1);

    const row2 = document.createElement("div");
    row2.className = "grid-2";
    row2.appendChild(createField("Location", parsed.header.location, v => parsed.header.location = v));
    row2.appendChild(createField("Email Address", parsed.header.email, v => parsed.header.email = v));
    cBody.appendChild(row2);

    const row3 = document.createElement("div");
    row3.className = "grid-2";
    row3.appendChild(createField("Phone Number", parsed.header.phone, v => parsed.header.phone = v));
    row3.appendChild(createField("Portfolio Website", parsed.header.portfolioUrl, v => parsed.header.portfolioUrl = v));
    cBody.appendChild(row3);

    const row4 = document.createElement("div");
    row4.className = "grid-2";
    row4.appendChild(createField("LinkedIn URL", parsed.header.linkedinUrl, v => parsed.header.linkedinUrl = v));
    row4.appendChild(createField("GitHub URL", parsed.header.githubUrl, v => parsed.header.githubUrl = v));
    cBody.appendChild(row4);

    elVisualContainer.appendChild(secContact);
  }

  if (parsed.hasDateMarker) {
    const secMeta = document.createElement("details");
    secMeta.className = "sec";
    secMeta.open = true;
    secMeta.innerHTML = `<summary><span class="summary-left">Date &amp; Recipient</span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
    const mBody = secMeta.querySelector(".sec-body");
    mBody.appendChild(createField("Letter Date", parsed.dateStr, v => parsed.dateStr = v));
    mBody.appendChild(createField("Recipient Address Block", parsed.recipientBlock, v => parsed.recipientBlock = v, true));
    elVisualContainer.appendChild(secMeta);
  }

  const secSalutation = document.createElement("details");
  secSalutation.className = "sec";
  secSalutation.open = true;
  secSalutation.innerHTML = `<summary><span class="summary-left">Salutation</span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
  secSalutation.querySelector(".sec-body").appendChild(createField("Salutation", parsed.salutation, v => parsed.salutation = v));
  elVisualContainer.appendChild(secSalutation);

  const secBody = document.createElement("details");
  secBody.className = "sec";
  secBody.open = true;
  secBody.innerHTML = `<summary><span class="summary-left">Body Paragraphs</span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
  const bBody = secBody.querySelector(".sec-body");

  parsed.paragraphs.forEach((pText, pIdx) => {
    const card = document.createElement("div");
    card.className = "entity-card";
    const eh = document.createElement("div");
    eh.className = "entity-header";
    eh.innerHTML = `<span class="entity-title">Paragraph #${pIdx + 1}</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon-only";
    delBtn.title = "Remove paragraph";
    delBtn.innerHTML = SVG_TRASH;
    delBtn.onclick = () => {
      parsed.paragraphs.splice(pIdx, 1);
      syncVisualToRaw();
      renderVisualEditor();
    };
    eh.appendChild(delBtn);
    card.appendChild(eh);

    const pField = document.createElement("div");
    pField.className = "field";
    const pArea = document.createElement("textarea");
    pArea.className = "summary-textarea";
    pArea.style.minHeight = "80px";
    pArea.value = pText;
    pArea.setAttribute("aria-label", `Paragraph ${pIdx + 1}`);
    pArea.oninput = () => { parsed.paragraphs[pIdx] = pArea.value; syncVisualToRaw(); };
    pField.appendChild(pArea);
    card.appendChild(pField);
    bBody.appendChild(card);
  });

  const addPBtn = document.createElement("button");
  addPBtn.className = "btn add-btn";
  addPBtn.innerHTML = `${SVG_PLUS}<span>Add paragraph</span>`;
  addPBtn.onclick = () => {
    parsed.paragraphs.push("New paragraph text.");
    syncVisualToRaw();
    renderVisualEditor();
  };
  bBody.appendChild(addPBtn);
  elVisualContainer.appendChild(secBody);

  const secClosing = document.createElement("details");
  secClosing.className = "sec";
  secClosing.open = true;
  secClosing.innerHTML = `<summary><span class="summary-left">Sign-off &amp; Signature</span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
  secClosing.querySelector(".sec-body").appendChild(createField("Closing Block", parsed.postBody, v => parsed.postBody = v, true));
  elVisualContainer.appendChild(secClosing);
}

function renderGenericForm(parsed) {
  const sec = document.createElement("details");
  sec.className = "sec";
  sec.open = true;
  sec.innerHTML = `<summary><span class="summary-left">Document Content</span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
  const body = sec.querySelector(".sec-body");
  const note = document.createElement("p");
  note.style.color = "var(--muted)";
  note.style.fontSize = "12px";
  note.textContent = "Standard sections not detected. Use the content editor below or switch to Typst mode.";
  body.appendChild(note);

  const field = document.createElement("div");
  field.className = "field";
  const area = document.createElement("textarea");
  area.className = "summary-textarea";
  area.style.minHeight = "360px";
  area.value = parsed.raw;
  area.setAttribute("aria-label", "Document content");
  area.oninput = () => { parsed.raw = area.value; syncVisualToRaw(); };
  field.appendChild(area);
  body.appendChild(field);
  elVisualContainer.appendChild(sec);
}

// =========================================================================
// Mode Switch & Event Handlers
// =========================================================================
function setMode(mode) {
  state.mode = mode;
  const isRaw = mode === "raw";
  const isPreview = mode === "preview";

  elEditorContainer.classList.toggle("raw-mode", isRaw);
  if (elMainWorkspace) {
    elMainWorkspace.classList.toggle("preview-only", isPreview);
    elMainWorkspace.classList.toggle("editor-only", !isPreview);
  }

  elModeForm.setAttribute("aria-pressed", mode === "form");
  elModeRaw.setAttribute("aria-pressed", isRaw);
  if (elModePreview) {
    elModePreview.setAttribute("aria-pressed", isPreview);
  }

  if (isRaw) {
    elRawTextarea.value = state.rawTypst;
  } else if (mode === "form") {
    state.rawTypst = elRawTextarea.value;
    renderVisualEditor();
  }
}

elModeForm.addEventListener("click", () => setMode("form"));
elModeRaw.addEventListener("click", () => setMode("raw"));
if (elModePreview) {
  elModePreview.addEventListener("click", () => setMode("preview"));
}
elRawTextarea.addEventListener("input", () => {
  state.rawTypst = elRawTextarea.value;
  setDirty(true);
});

// =========================================================================
// Panel Resizer (Split-Pane Slider)
// =========================================================================
const elResizer = document.getElementById("panel-resizer");
const elMainWorkspace = document.getElementById("main-workspace");
let isDraggingResizer = false;

function setEditorWidth(newWidth) {
  const minWidth = 300;
  const maxWidth = window.innerWidth - 300;
  const clamped = Math.max(minWidth, Math.min(maxWidth, newWidth));
  document.documentElement.style.setProperty("--editor-width", `${clamped}px`);
  try {
    localStorage.setItem("pickme_studio_editor_width", clamped.toString());
  } catch (e) {}
}

// Restore saved width on init
try {
  const savedWidth = localStorage.getItem("pickme_studio_editor_width");
  if (savedWidth) {
    const parsedWidth = parseInt(savedWidth, 10);
    if (!isNaN(parsedWidth)) {
      setEditorWidth(parsedWidth);
    }
  }
} catch (e) {}

if (elResizer) {
  elResizer.addEventListener("pointerdown", (e) => {
    isDraggingResizer = true;
    elResizer.setPointerCapture(e.pointerId);
    elResizer.classList.add("dragging");
    document.body.classList.add("is-resizing");
  });

  elResizer.addEventListener("pointermove", (e) => {
    if (!isDraggingResizer) return;
    const mainRect = elMainWorkspace ? elMainWorkspace.getBoundingClientRect() : { left: 0 };
    const newWidth = e.clientX - mainRect.left;
    setEditorWidth(newWidth);
  });

  const stopDragging = (e) => {
    if (!isDraggingResizer) return;
    isDraggingResizer = false;
    try {
      elResizer.releasePointerCapture(e.pointerId);
    } catch (err) {}
    elResizer.classList.remove("dragging");
    document.body.classList.remove("is-resizing");
  };

  elResizer.addEventListener("pointerup", stopDragging);
  elResizer.addEventListener("pointercancel", stopDragging);

  // Keyboard accessibility
  elResizer.addEventListener("keydown", (e) => {
    const currentWidth = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--editor-width") || "480",
      10
    );
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setEditorWidth(currentWidth - 20);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setEditorWidth(currentWidth + 20);
    }
  });
}

// Dropdown Menu Toggle
elBtnExportToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = elExportMenu.classList.toggle("open");
  elBtnExportToggle.setAttribute("aria-expanded", open);
});

document.addEventListener("click", () => {
  elExportMenu.classList.remove("open");
  elBtnExportToggle.setAttribute("aria-expanded", "false");
});

// Theme Toggle
elBtnTheme.addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = getComputedStyle(root).getPropertyValue("--bg").trim().toLowerCase() === "#000000" ||
                 root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", isDark ? "light" : "dark");
});

// Downloads
elBtnDownloadTyp.addEventListener("click", () => {
  const blob = new Blob([state.rawTypst], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = state.filename || "document.typ";
  a.click();
  URL.revokeObjectURL(a.href);
});

elBtnDownloadPdf.addEventListener("click", () => {
  if (state.pdfPath) {
    window.location.href = `/api/pdf?path=${encodeURIComponent(state.pdfPath)}&download=1`;
  } else {
    saveAndCompile(true);
  }
});

// Upload Local File
function handleUploadedTypFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const content = evt.target.result;
      if (typeof content !== "string") return;

      state.path = "";
      state.filename = file.name;
      state.rawTypst = content;
      elRawTextarea.value = content;

      // Update dropdown option to show the uploaded file
      let uploadedOpt = elFileSelect.querySelector('option[data-uploaded="true"]');
      if (!uploadedOpt) {
        uploadedOpt = document.createElement("option");
        uploadedOpt.setAttribute("data-uploaded", "true");
        elFileSelect.insertBefore(uploadedOpt, elFileSelect.firstChild);
      }
      uploadedOpt.value = "uploaded:" + file.name;
      uploadedOpt.textContent = "[Uploaded] " + file.name;
      elFileSelect.value = uploadedOpt.value;

      try {
        renderVisualEditor();
        setMode("form");
      } catch (renderErr) {
        console.warn("Visual parsing failed, defaulting to raw Typst view:", renderErr);
        setMode("raw");
      }

      setDirty(true, "Uploaded " + file.name);
      saveAndCompile();
    } catch (err) {
      setError("Error processing file: " + err.message);
    }
  };

  reader.onerror = () => {
    setError("Failed to read local file.");
  };

  reader.onloadend = () => {
    if (elFileUpload) elFileUpload.value = "";
  };

  reader.readAsText(file, "UTF-8");
}

if (elBtnUpload) {
  elBtnUpload.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (elFileUpload) elFileUpload.click();
    }
  });
}

if (elFileUpload) {
  elFileUpload.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleUploadedTypFile(file);
  });
}

// Drag & drop file upload support across workspace
window.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.name.endsWith(".typ") || file.name.endsWith(".txt")) {
      handleUploadedTypFile(file);
    }
  }
});

// File Select Dropdown Change
elFileSelect.addEventListener("change", () => {
  const chosen = elFileSelect.value;
  if (chosen) loadFile(chosen);
});

// =========================================================================
// API Integration: Load, Files, Compile
// =========================================================================
async function loadFileList() {
  try {
    const res = await fetch("/api/files");
    const data = await res.json();
    if (!data.ok) return;

    elFileSelect.innerHTML = "";
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Select an application file --";
    elFileSelect.appendChild(defaultOpt);

    (data.files || []).forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.path;
      opt.textContent = f.label || f.name;
      elFileSelect.appendChild(opt);
    });

    if (data.initialFile) {
      elFileSelect.value = data.initialFile;
      loadFile(data.initialFile);
    } else if (data.files && data.files.length > 0) {
      elFileSelect.value = data.files[0].path;
      loadFile(data.files[0].path);
    }
  } catch (e) {
    console.warn("Could not load /api/files:", e);
  }
}

async function loadFile(filePath) {
  try {
    setDirty(false, "Loading...");
    const res = await fetch(`/api/load?path=${encodeURIComponent(filePath)}`);
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "File load failed");
      return;
    }

    setError("");
    state.path = data.path;
    state.filename = data.filename;
    state.rawTypst = data.content;
    state.pdfPath = data.pdfPath;
    state.pdfUrl = data.pdfUrl;
    elPdfFrame.src = data.pdfUrl;

    renderVisualEditor();
    setDirty(false, "All changes saved");
  } catch (e) {
    setError("Network error while loading file: " + e.message);
  }
}

async function saveAndCompile(triggerDownloadAfter = false) {
  try {
    setDirty(true, "Compiling...");
    elBtnSave.disabled = true;

    const payload = {
      path: state.path,
      filename: state.filename,
      content: state.rawTypst
    };

    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    elBtnSave.disabled = false;

    if (!data.ok) {
      setError(data.error || "Typst compilation failed");
      return;
    }

    setError("");
    state.path = data.path;
    state.filename = data.filename;
    state.pdfPath = data.pdfPath;
    state.pdfUrl = data.pdfUrl;
    elPdfFrame.src = data.pdfUrl;

    setDirty(false, `Saved (${data.ms || 0}ms)`);

    if (triggerDownloadAfter) {
      window.location.href = `/api/pdf?path=${encodeURIComponent(data.pdfPath)}&download=1`;
    }
  } catch (e) {
    elBtnSave.disabled = false;
    setError("Compile request failed: " + e.message);
  }
}

elBtnSave.addEventListener("click", () => saveAndCompile());

// Global Keyboard Shortcuts (Ctrl+S / Cmd+S)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveAndCompile();
  }
});

// Initialization
loadFileList();

