// parser.js - Pure Typst AST Parser & Serializer for Pick Me Studio
// Zero DOM dependencies; runs in both Browser (window.StudioParser) and Node.js (module.exports)

const DEFAULT_COVER_LETTER_PREAMBLE = `// Clean Professional Cover Letter Template

#set page(
  paper: "a4",
  margin: (x: 2.0cm, top: 2.0cm, bottom: 2.0cm),
)

#set text(
  font: ("Segoe UI", "Arial"),
  size: 10.5pt,
  fill: rgb("#111827"),
  lang: "en",
)

#set par(justify: true, leading: 0.7em)`;

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
    results.push({ start: idx, end: closeParen + 1, inner });
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
    return (
      text.includes("#link(") ||
      text.includes("mailto:") ||
      text.includes("@") ||
      /\+?\d[\d\s-]{7,}/.test(text)
    );
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

function formatContactParts(h) {
  const parts = [];
  if (h.location) parts.push(h.location);
  if (h.email) {
    const cleanEmail = h.email.replace(/^\\@/, "").replace(/\\/g, "").trim();
    const fullEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@gmail.com`;
    const emailDisplay = fullEmail.replace(/@/g, "\\@");
    parts.push(`#link("mailto:${fullEmail}")[${emailDisplay}]`);
  }
  if (h.phone) parts.push(h.phone);
  if (h.linkedinUrl) parts.push(`#link("${h.linkedinUrl}")[${h.linkedinLabel || "LinkedIn"}]`);
  if (h.githubUrl) parts.push(`#link("${h.githubUrl}")[${h.githubLabel || "GitHub"}]`);
  if (h.portfolioUrl) parts.push(`#link("${h.portfolioUrl}")[${h.portfolioLabel || "Portfolio"}]`);
  return parts;
}

function serializeHeader(h) {
  const contactLine = formatContactParts(h).join(" | \n    ");
  return `// Header\n#align(center)[\n  #text(size: 16pt, weight: "bold")[${h.name}] \\\n  #v(0.5pt)\n  #text(size: 9.5pt, weight: "medium", fill: rgb("#374151"))[${h.title}] \\\n  #v(1.5pt)\n  #text(size: 8.2pt, fill: rgb("#4b5563"))[\n    ${contactLine}\n  ]\n]`;
}

function serializeCoverLetterHeader(h) {
  const contactLine = formatContactParts(h).join(" | \n  ");
  return `// Header\n#text(size: 20pt, weight: "bold")[${h.name}] \\\n#v(2pt)\n#text(size: 12pt, fill: rgb("#374151"))[${h.title}] \\\n#v(4pt)\n#text(size: 9pt, fill: rgb("#4b5563"))[\n  ${contactLine}\n]\n\n#v(8pt)\n#line(length: 100%, stroke: 0.8pt + rgb("#e5e7eb"))\n#v(12pt)`;
}

// =========================================================================
// Education, Certifications & Skills Parsers & Serializers
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
    if (!brM) {
      pos = parenClose + 1;
      continue;
    }
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
    if (degMatch) degree = degMatch[1].trim();

    const instMatch = block.match(/(?:---|--|—|–)\s*#?([^\]\n]+?)(?:\]|\n|$)/);
    if (instMatch) institution = instMatch[1].trim().replace(/\]$/, "");

    const dateMatch =
      block.match(/text\((?:(?!\[)[\s\S])*?size:\s*\d+(?:\.\d+)?pt(?:(?!\[)[\s\S])*?\)\[#?([^\]]+)\]/) ||
      block.match(/\[\s*([A-Za-z]{3,}\s+\d{4}\s*(?:---|--|-|—|–)\s*(?:[A-Za-z]{3,}\s+\d{4}|Present|\d{4}))\s*\]/);
    if (dateMatch) date = dateMatch[1].trim();

    const locMatch =
      block.match(/style:\s*"italic"[^)]*\)\[#?([^\]]+)\]/) ||
      block.match(/text\([^)]*italic[^)]*\)\[#?([^\]]+)\]/);
    if (locMatch) location = locMatch[1].trim();

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
    if (
      item &&
      item !== "•" &&
      item !== "*" &&
      !item.startsWith("columns:") &&
      !item.startsWith("row-gutter:") &&
      !item.startsWith("column-gutter:")
    ) {
      let clean = item.replace(/^•\s*/, "").trim();
      let name = "";
      let issuer = "";
      let year = "";

      const boldM = clean.match(/^\*([^*]+)\*/);
      if (boldM) {
        name = boldM[1].trim();
        clean = clean.slice(boldM[0].length).trim();
      }

      const sepM = clean.match(/^(?:---|--|-|—|–)\s*(.*)$/);
      if (sepM) {
        clean = sepM[1].trim();
      }

      const yrM = clean.match(/\((\d{4})\)\s*$/);
      if (yrM) {
        year = yrM[1];
        clean = clean.slice(0, yrM.index).trim();
      }

      issuer = clean.replace(/(?:---|--|-|—|–)$/, "").trim();
      if (!name && clean) name = clean;

      if (name) {
        certs.push({ name, issuer, year });
      }
    }
    pos = cb + 1;
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
function detectDocType(typ, filename = "") {
  const fn = (filename || "").toLowerCase();
  const lower = (typ || "").toLowerCase();

  if (typ.includes("#let exp-entry") || typ.includes('#section-title(') || fn.includes("resume")) {
    return "resume";
  }
  if (
    fn.includes("letter") ||
    fn.includes("cover") ||
    lower.includes("cover letter") ||
    lower.includes("dear ") ||
    (lower.includes("hiring team") && (lower.includes("sincerely") || lower.includes("regards")))
  ) {
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

    if (
      (body.includes("#grid(") && (body.includes("[*") || titleLower.includes("skill"))) ||
      body.includes("SKILLS_BLOCK_PLACEHOLDER") ||
      titleLower.includes("skill")
    ) {
      sections.push({
        title,
        type: "skills-grid",
        rows: parseSkillsGrid(body),
        rawBody: body
      });
    } else if (
      body.includes("#exp-entry(") ||
      body === "EXPERIENCE_BLOCK_PLACEHOLDER" ||
      titleLower.includes("experience")
    ) {
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
        entries: parsedEntries
      });
    } else if (
      body.includes("#project-entry(") ||
      body === "PROJECTS_BLOCK_PLACEHOLDER" ||
      titleLower.includes("project")
    ) {
      const parsedProjects = extractBalancedCalls(body, "project-entry").map(c => ({
        name: parseNamedStringArg(c.inner, "name"),
        stack: parseNamedStringArg(c.inner, "stack"),
        date: parseNamedStringArg(c.inner, "date"),
        bullets: parseBulletsTuple(c.inner)
      }));
      sections.push({
        title,
        type: "project-list",
        entries: parsedProjects
      });
    } else if (
      titleLower.includes("education") ||
      body.includes("Bachelor") ||
      body.includes("University") ||
      body === "EDUCATION_BLOCK_PLACEHOLDER"
    ) {
      sections.push({
        title,
        type: "education",
        entries: parseEducationSection(body)
      });
    } else if (
      titleLower.includes("certification") ||
      titleLower.includes("training") ||
      body === "CERTIFICATIONS_BLOCK_PLACEHOLDER"
    ) {
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

function escapeTypstString(str) {
  if (!str) return "";
  return String(str).replace(/([^\\])(")/g, '$1\\"').replace(/^"/, '\\"');
}

const CANONICAL_EXP_ENTRY = `#let exp-entry(title: "", company: "", location: "", date: "", bullets: ()) = {
  block(width: 100%, breakable: false)[
    #grid(
      columns: (1fr, auto),
      text(weight: "bold")[#title] + text(fill: rgb("#4b5563"))[ --- #company],
      text(fill: rgb("#4b5563"), size: 8.3pt)[#date],
    )
    #if location != "" [
      #v(-2.5pt)
      #text(size: 7.8pt, fill: rgb("#6b7280"), style: "italic")[#location]
    ]
    #v(0.5pt)
    #list(
      marker: [•],
      spacing: 2.2pt,
      ..bullets
    )
    #v(1.5pt)
  ]
}`;

const CANONICAL_PROJECT_ENTRY = `#let project-entry(name: "", stack: "", date: "", bullets: ()) = {
  block(width: 100%, breakable: false)[
    #grid(
      columns: (1fr, auto),
      [
        #text(weight: "bold")[#name]
        #if stack != "" [
          #text(size: 7.8pt, fill: rgb("#4b5563"))[ (#stack)]
        ]
      ],
      text(fill: rgb("#4b5563"), size: 8.3pt)[#date],
    )
    #v(0.5pt)
    #list(
      marker: [•],
      spacing: 2.2pt,
      ..bullets
    )
    #v(1.5pt)
  ]
}`;

function upgradeMacroIfTruncated(preamble, macroName, requiredTokens, canonicalDef) {
  const re = new RegExp(`#let\\s+${macroName}\\s*\\(`);
  const m = re.exec(preamble);
  if (!m) return preamble;

  const startIdx = m.index;
  const openParen = startIdx + m[0].length - 1;
  const closeParen = findMatchingBracket(preamble, openParen, "(", ")");
  if (closeParen === -1) return preamble;

  const afterParams = preamble.slice(closeParen + 1);
  const braceMatch = /^\s*=\s*\{/.exec(afterParams);
  let endIdx = -1;

  if (braceMatch) {
    const openBrace = closeParen + 1 + braceMatch[0].length - 1;
    endIdx = findMatchingBracket(preamble, openBrace, "{", "}");
  } else {
    const lineMatch = /^\s*=\s*[^\r\n]+/.exec(afterParams);
    if (lineMatch) {
      endIdx = closeParen + 1 + lineMatch[0].length - 1;
    }
  }
  if (endIdx === -1) return preamble;

  const fullMacro = preamble.slice(startIdx, endIdx + 1);
  const missingAny = requiredTokens.some(tok => !fullMacro.includes(tok));
  if (!missingAny) return preamble;

  return preamble.slice(0, startIdx) + canonicalDef + preamble.slice(endIdx + 1);
}

function normalizeStylePreamble(preamble) {
  if (!preamble) return "";
  let out = preamble;
  out = upgradeMacroIfTruncated(out, "exp-entry", ["location:", "date:", "#location", "#date"], CANONICAL_EXP_ENTRY);
  out = upgradeMacroIfTruncated(out, "project-entry", ["stack:", "date:", "#stack", "#date"], CANONICAL_PROJECT_ENTRY);
  return out;
}

function serializeResume(parsed) {
  const preamble = normalizeStylePreamble(parsed.stylePreamble || "");
  const headerTyp = serializeHeader(parsed.header);
  const secStrings = parsed.sections.map(sec => {
    const heading = `#section-title("${sec.title}")`;
    if (sec.type === "skills-grid") {
      return `${heading}\n${serializeSkillsGrid(sec.rows)}`;
    }
    if (sec.type === "exp-list") {
      const entriesTyp = sec.entries.map(e => {
        const bArr = e.bullets || [];
        const bulletsTyp = bArr.map(b => `[${b}]`).join(",\n    ") + (bArr.length === 1 ? "," : "");
        let out = `#exp-entry(\n  title: "${escapeTypstString(e.title || "")}",\n  company: "${escapeTypstString(e.company || "")}",`;
        if (e.location) out += `\n  location: "${escapeTypstString(e.location)}",`;
        out += `\n  date: "${escapeTypstString(e.date || "")}",\n  bullets: (\n    ${bulletsTyp}\n  )\n)`;
        return out;
      }).join("\n\n");
      return `${heading}\n${entriesTyp}`;
    }
    if (sec.type === "project-list") {
      const projsTyp = sec.entries.map(p => {
        const bArr = p.bullets || [];
        const bulletsTyp = bArr.map(b => `[${b}]`).join(",\n    ") + (bArr.length === 1 ? "," : "");
        let out = `#project-entry(\n  name: "${escapeTypstString(p.name || "")}",`;
        if (p.stack) out += `\n  stack: "${escapeTypstString(p.stack)}",`;
        if (p.date) out += `\n  date: "${escapeTypstString(p.date)}",`;
        out += `\n  bullets: (\n    ${bulletsTyp}\n  )\n)`;
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

  return `${preamble}\n\n${headerTyp}\n\n${secStrings.join("\n\n")}\n`;
}

// =========================================================================
// Cover Letter Parser & Serializer
// =========================================================================
function parseCoverLetter(typ) {
  const salutationMatch = typ.match(/(?:^|\r?\n)((?:Dear|To)\s+[^\r\n]+)(?:\r?\n|$)/i);
  const valedictionMatch = typ.match(
    /(?:^|\r?\n)(?:#v\([^)]*\)\s*(?:\r?\n)?)?(Sincerely|Best Regards|Warm Regards|Kind Regards|Regards|Respectfully|Best|Warmly)(?:,\s*|\\|\r?\n)/i
  );

  if (!salutationMatch) {
    return { kind: "generic", raw: typ };
  }

  const salutation = salutationMatch[1].trim();
  const salutationIdx =
    salutationMatch.index + (salutationMatch[0].startsWith("\n") || salutationMatch[0].startsWith("\r") ? 1 : 0);
  const preSalutation = typ.slice(0, salutationIdx).trimEnd();

  const bodyStart = salutationMatch.index + salutationMatch[0].length;
  let bodyEnd = typ.length;
  let valediction = "Sincerely,";
  let signerName = "";

  if (valedictionMatch) {
    bodyEnd = valedictionMatch.index;
    valediction = valedictionMatch[1].trim();
    if (!valediction.endsWith(",")) valediction += ",";

    const afterValediction = typ.slice(valedictionMatch.index + valedictionMatch[0].length).trim();
    const nameMatch = afterValediction.match(
      /(?:^|\r?\n)(?:#v\([^)]*\)\s*(?:\r?\n)?)?(?:\*([^*]+)\*|([A-Za-z\s\.\-]{3,}))/
    );
    if (nameMatch) {
      signerName = (nameMatch[1] || nameMatch[2] || "").replace(/\\/g, "").trim();
    }
  }

  const rawBody = typ.slice(bodyStart, bodyEnd).trim();
  const paragraphs = rawBody
    .split(/(?:\r?\n)+\s*#v\(\d+(?:\.\d+)?pt\)\s*(?:\r?\n)+|(?:\r?\n){2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  let topSection = preSalutation;
  let dateStr = "";
  let recipientLines = [];
  let recipientBlock = "";
  const dateMarker = "// Date & Recipient";
  const dmIdx = preSalutation.indexOf(dateMarker);

  if (dmIdx !== -1) {
    topSection = preSalutation.slice(0, dmIdx).trimEnd();
    const afterDate = preSalutation.slice(dmIdx + dateMarker.length).trim();
    const vParts = afterDate.split(/#v\(\d+(?:\.\d+)?pt\)/);
    dateStr = (vParts[0] || "").trim();
    recipientBlock = (vParts.slice(1).join("\n") || "").trim();
  } else {
    const dateM = preSalutation.match(
      /(?:^|\r?\n)((?:[A-Za-z]+\s+\d{1,2},\s+\d{4})|(?:\d{4}-\d{2}-\d{2}))(?:\r?\n)/
    );
    if (dateM) {
      dateStr = dateM[1].trim();
      const afterD = preSalutation.slice(dateM.index + dateM[0].length);
      recipientBlock = afterD.replace(/#v\([^)]*\)/g, "").trim();
      topSection = preSalutation.slice(0, dateM.index).trimEnd();
    }
  }

  if (recipientBlock) {
    recipientLines = recipientBlock
      .split(/\r?\n/)
      .map(line => {
        let clean = line.trim();
        while (clean.endsWith("\\") || clean.endsWith("*")) clean = clean.slice(0, -1).trim();
        while (clean.startsWith("*")) clean = clean.slice(1).trim();
        return clean;
      })
      .filter(Boolean);
  }

  let stylePreamble = "";
  let headerBlock = topSection;
  const headerMarker = "// Header";
  const hmIdx = topSection.indexOf(headerMarker);
  if (hmIdx !== -1) {
    stylePreamble = topSection.slice(0, hmIdx).trim();
    headerBlock = topSection.slice(hmIdx).trim();
  } else {
    const firstHeaderCall = topSection.search(/#(?:align|text)\(/);
    if (firstHeaderCall !== -1) {
      stylePreamble = topSection.slice(0, firstHeaderCall).trim();
      headerBlock = topSection.slice(firstHeaderCall).trim();
    }
  }

  if (!stylePreamble.includes("#set page") || !stylePreamble.includes("#set text")) {
    stylePreamble = DEFAULT_COVER_LETTER_PREAMBLE;
  }

  const header = parseResumeHeader(headerBlock);
  if (!signerName && header && header.name) {
    signerName = header.name;
  }

  return {
    kind: "cover-letter",
    stylePreamble,
    headerBlock,
    header,
    hasDateMarker: dmIdx !== -1 || Boolean(dateStr),
    dateStr,
    recipientBlock,
    recipientLines,
    salutation,
    paragraphs,
    valediction,
    signerName
  };
}

function serializeCoverLetter(parsed) {
  const preamble =
    parsed.stylePreamble && parsed.stylePreamble.includes("#set page")
      ? parsed.stylePreamble
      : DEFAULT_COVER_LETTER_PREAMBLE;

  let headerTyp = "";
  if (parsed.header && parsed.header.name) {
    headerTyp = serializeCoverLetterHeader(parsed.header);
  } else {
    headerTyp = parsed.headerBlock || "";
  }

  let recipientTyp = "";
  if (parsed.recipientLines && parsed.recipientLines.length > 0) {
    recipientTyp = parsed.recipientLines
      .map((line, idx) => {
        const clean = line.trim();
        if (!clean) return "";
        if (idx === 0) return `*${clean}* \\`;
        return `${clean} \\`;
      })
      .filter(Boolean)
      .join("\n")
      .replace(/\\\s*$/, "");
  } else if (parsed.recipientBlock) {
    recipientTyp = parsed.recipientBlock;
  }

  const dateBlock = parsed.dateStr
    ? `// Date & Recipient\n${parsed.dateStr}\n\n#v(8pt)\n${recipientTyp}\n\n#v(14pt)`
    : recipientTyp
      ? `// Date & Recipient\n#v(8pt)\n${recipientTyp}\n\n#v(14pt)`
      : "";

  const salutation = parsed.salutation || "Dear Hiring Team,";
  const bodyJoined = (parsed.paragraphs || []).join("\n\n#v(10pt)\n");

  const valediction = parsed.valediction || "Sincerely,";
  const signer = parsed.signerName || (parsed.header ? parsed.header.name : "");
  const closingBlock = `#v(16pt)\n${valediction} \\\n#v(14pt)\n*${signer}*`;

  return `${preamble}\n\n${headerTyp}\n\n${dateBlock ? dateBlock + "\n\n" : ""}${salutation}\n\n${bodyJoined}\n\n${closingBlock}\n`;
}

const StudioParser = {
  DEFAULT_COVER_LETTER_PREAMBLE,
  findMatchingBracket,
  extractBalancedCalls,
  parseNamedStringArg,
  parseBulletsTuple,
  parseResumeHeader,
  serializeHeader,
  serializeCoverLetterHeader,
  parseEducationSection,
  serializeEducation,
  parseCertificationsSection,
  serializeCertifications,
  parseSkillsGrid,
  serializeSkillsGrid,
  detectDocType,
  parseResume,
  serializeResume,
  parseCoverLetter,
  serializeCoverLetter,
  normalizeStylePreamble,
  escapeTypstString
};

if (typeof window !== "undefined") {
  window.StudioParser = StudioParser;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = StudioParser;
}

