// editor.js - Visual Form DOM Builder for Pick Me Studio
// Parameterized via container and { onSync, onReRender } callbacks

const SVG_TRASH = `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
const SVG_PLUS = `<svg class="svg-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="4.5" x2="8" y2="11.5"/><line x1="4.5" y1="8" x2="11.5" y2="8"/></svg>`;
const SVG_CHEVRON = `<svg class="svg-icon summary-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
const SVG_UP = `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
const SVG_DOWN = `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

function createField(label, value, onInput, onSync, multiline = false) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  const input = document.createElement(multiline ? "textarea" : "input");
  if (!multiline) input.type = "text";
  input.value = value || "";
  input.addEventListener("input", () => {
    onInput(input.value);
    if (onSync) onSync();
  });
  wrap.append(lbl, input);
  return wrap;
}

function createIconButton(svg, title, onClick, className = "btn-icon-only") {
  const btn = document.createElement("button");
  btn.className = className;
  btn.title = title;
  btn.innerHTML = svg;
  btn.onclick = onClick;
  return btn;
}

function createAddButton(label, onClick, className = "btn add-btn") {
  const btn = document.createElement("button");
  btn.className = className;
  btn.innerHTML = `${SVG_PLUS}<span>${label}</span>`;
  btn.onclick = onClick;
  return btn;
}

function createSection(titleText) {
  const details = document.createElement("details");
  details.className = "sec";
  details.open = true;
  details.innerHTML = `<summary><span class="summary-left"></span>${SVG_CHEVRON}</summary><div class="sec-body"></div>`;
  const titleSpan = details.querySelector(".summary-left");
  if (titleSpan) titleSpan.textContent = titleText;
  return { details, body: details.querySelector(".sec-body"), summary: details.querySelector("summary") };
}

function moveSection(sections, fromIdx, toIdx) {
  if (!Array.isArray(sections) || toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return false;
  const [moved] = sections.splice(fromIdx, 1);
  sections.splice(toIdx, 0, moved);
  return true;
}

function createEntityCard({
  titleText,
  deleteTitle,
  onDelete,
  rows = [],
  bullets = null,
  onEnsureBullets = null,
  bulletPlaceholder = "",
  removeBulletTitle = "Remove item",
  addBulletLabel = "",
  onSync,
  onReRender
}) {
  const card = document.createElement("div");
  card.className = "entity-card";
  const eh = document.createElement("div");
  eh.className = "entity-header";
  const titleEl = document.createElement("span");
  titleEl.className = "entity-title";
  titleEl.textContent = typeof titleText === "function" ? titleText() : titleText;
  eh.append(titleEl, createIconButton(SVG_TRASH, deleteTitle, onDelete));
  card.appendChild(eh);

  for (const row of rows) {
    const target = row.length === 1 ? card : Object.assign(document.createElement("div"), { className: "grid-2" });
    for (const [lbl, val, setter, updatesTitle] of row) {
      target.appendChild(
        createField(lbl, val, v => {
          setter(v);
          if (updatesTitle && typeof titleText === "function") titleEl.textContent = titleText();
        }, onSync)
      );
    }
    if (row.length > 1) card.appendChild(target);
  }

  if (addBulletLabel) {
    const listArr = bullets || [];
    const bList = document.createElement("div");
    bList.className = "bullet-list";
    listArr.forEach((bText, bIdx) => {
      const bRow = document.createElement("div");
      bRow.className = "bullet-row";
      const bArea = document.createElement("textarea");
      bArea.value = bText;
      bArea.placeholder = bulletPlaceholder;
      bArea.oninput = () => {
        listArr[bIdx] = bArea.value;
        if (onSync) onSync();
      };
      bRow.append(
        bArea,
        createIconButton(SVG_TRASH, removeBulletTitle, () => {
          listArr.splice(bIdx, 1);
          if (onSync) onSync();
          if (onReRender) onReRender();
        })
      );
      bList.appendChild(bRow);
    });
    card.append(
      bList,
      createAddButton(
        addBulletLabel,
        () => {
          const targetArr = onEnsureBullets ? onEnsureBullets() : listArr;
          targetArr.push("");
          if (onSync) onSync();
          if (onReRender) onReRender();
        },
        "bullet-add-btn"
      )
    );
  }
  return card;
}

function createContactSection(header, onSync) {
  const { details, body } = createSection("Contact & Header");
  const rows = [
    [["Full Name", header.name, v => (header.name = v)], ["Target Role / Title", header.title, v => (header.title = v)]],
    [["Location", header.location, v => (header.location = v)], ["Email Address", header.email, v => (header.email = v)]],
    [["Phone Number", header.phone, v => (header.phone = v)], ["Portfolio Website", header.portfolioUrl, v => (header.portfolioUrl = v)]],
    [["LinkedIn URL", header.linkedinUrl, v => (header.linkedinUrl = v)], ["GitHub URL", header.githubUrl, v => (header.githubUrl = v)]]
  ];
  for (const pair of rows) {
    const grid = document.createElement("div");
    grid.className = "grid-2";
    for (const [lbl, val, setter] of pair) grid.appendChild(createField(lbl, val, setter, onSync));
    body.appendChild(grid);
  }
  return details;
}

function renderResumeForm(container, parsed, { onSync, onReRender }) {
  container.appendChild(createContactSection(parsed.header, onSync));

  parsed.sections.forEach((sec, sIdx) => {
    const { details, body: sBody, summary: secSummary } = createSection(sec.title);
    if (secSummary) {
      const actionsWrap = document.createElement("span");
      actionsWrap.style.cssText = "margin-left:auto;margin-right:6px;display:inline-flex;gap:2px;";

      const makeMoveBtn = (svg, dir, label) => {
        const btn = createIconButton(svg, "Move section " + label, e => {
          e.preventDefault();
          e.stopPropagation();
          if (moveSection(parsed.sections, sIdx, sIdx + dir)) {
            onSync();
            onReRender();
          }
        });
        btn.disabled = sIdx + dir < 0 || sIdx + dir >= parsed.sections.length;
        return btn;
      };

      const delSecBtn = createIconButton(
        SVG_TRASH,
        "Remove " + sec.title + " section",
        e => {
          e.preventDefault();
          e.stopPropagation();
          parsed.sections.splice(sIdx, 1);
          onSync();
          onReRender();
        },
        "btn-icon-only section-del-btn"
      );

      actionsWrap.append(makeMoveBtn(SVG_UP, -1, "up"), makeMoveBtn(SVG_DOWN, 1, "down"), delSecBtn);
      secSummary.insertBefore(actionsWrap, secSummary.lastElementChild);
    }

    if (sec.type === "skills-grid") {
      const box = document.createElement("div");
      box.className = "skills-box";
      sec.rows.forEach((row, rIdx) => {
        const rDiv = document.createElement("div");
        rDiv.className = "skill-row";
        [
          ["cat-input", "category", "Category"],
          ["val-input", "skills", "Comma-separated skills"]
        ].forEach(([cls, key, ph]) => {
          const inp = document.createElement("input");
          inp.type = "text";
          inp.className = cls;
          inp.value = row[key] || "";
          inp.placeholder = ph;
          inp.oninput = () => {
            row[key] = inp.value;
            onSync();
          };
          rDiv.appendChild(inp);
        });
        rDiv.appendChild(
          createIconButton(SVG_TRASH, "Remove skill category", () => {
            sec.rows.splice(rIdx, 1);
            onSync();
            onReRender();
          })
        );
        box.appendChild(rDiv);
      });
      sBody.append(
        box,
        createAddButton("Add category", () => {
          sec.rows.push({ category: "New Category", skills: "" });
          onSync();
          onReRender();
        })
      );
    } else if (sec.type === "exp-list") {
      sec.entries.forEach((entry, eIdx) => {
        sBody.appendChild(
          createEntityCard({
            titleText: () => `${entry.company || "Role"} - ${entry.title || ""}`,
            deleteTitle: "Remove role",
            onDelete: () => {
              sec.entries.splice(eIdx, 1);
              onSync();
              onReRender();
            },
            rows: [
              [["Role Title", entry.title, v => (entry.title = v), true], ["Company", entry.company, v => (entry.company = v), true]],
              [["Location", entry.location, v => (entry.location = v)], ["Date Range", entry.date, v => (entry.date = v)]]
            ],
            bullets: entry.bullets,
            onEnsureBullets: () => (entry.bullets = entry.bullets || []),
            bulletPlaceholder: "Responsibility or achievement highlight",
            removeBulletTitle: "Remove highlight",
            addBulletLabel: "Add highlight",
            onSync,
            onReRender
          })
        );
      });
      sBody.appendChild(
        createAddButton("Add role", () => {
          sec.entries.push({
            title: "Role Title",
            company: "Company",
            location: "Location",
            date: "2025 -- Present",
            bullets: ["Verified system reliability and core components."]
          });
          onSync();
          onReRender();
        })
      );
    } else if (sec.type === "project-list") {
      sec.entries.forEach((proj, pIdx) => {
        sBody.appendChild(
          createEntityCard({
            titleText: () => proj.name || "Project",
            deleteTitle: "Remove project",
            onDelete: () => {
              sec.entries.splice(pIdx, 1);
              onSync();
              onReRender();
            },
            rows: [
              [["Project Name", proj.name, v => (proj.name = v), true], ["Tech Stack", proj.stack, v => (proj.stack = v)]],
              [["Date Range", proj.date, v => (proj.date = v)]]
            ],
            bullets: proj.bullets,
            onEnsureBullets: () => (proj.bullets = proj.bullets || []),
            bulletPlaceholder: "Technical project outcome or implementation detail",
            removeBulletTitle: "Remove project bullet",
            addBulletLabel: "Add project bullet",
            onSync,
            onReRender
          })
        );
      });
      sBody.appendChild(
        createAddButton("Add project", () => {
          sec.entries.push({
            name: "Project Name",
            stack: "Python, SQL",
            date: "2026",
            bullets: ["Engineered scalable architecture with automated testing."]
          });
          onSync();
          onReRender();
        })
      );
    } else if (sec.type === "education") {
      sec.entries.forEach((edu, eIdx) => {
        sBody.appendChild(
          createEntityCard({
            titleText: () => `${edu.degree || "Degree"} - ${edu.institution || ""}`,
            deleteTitle: "Remove education",
            onDelete: () => {
              sec.entries.splice(eIdx, 1);
              onSync();
              onReRender();
            },
            rows: [
              [["Degree / Qualification", edu.degree, v => (edu.degree = v), true], ["Institution / University", edu.institution, v => (edu.institution = v), true]],
              [["Location", edu.location, v => (edu.location = v)], ["Date / Graduation Year", edu.date, v => (edu.date = v)]]
            ],
            bullets: edu.honors,
            onEnsureBullets: () => (edu.honors = edu.honors || []),
            bulletPlaceholder: "Honors, GWA, or academic achievement",
            removeBulletTitle: "Remove honor highlight",
            addBulletLabel: "Add honor highlight",
            onSync,
            onReRender
          })
        );
      });
      sBody.appendChild(
        createAddButton("Add education", () => {
          sec.entries.push({ degree: "Degree / Program", institution: "University", location: "Location", date: "2026", honors: [] });
          onSync();
          onReRender();
        })
      );
    } else if (sec.type === "certifications") {
      const box = document.createElement("div");
      box.className = "certs-box";
      sec.entries.forEach((cert, cIdx) => {
        const cRow = document.createElement("div");
        cRow.className = "cert-row";
        [
          ["name", "Certification Title"],
          ["issuer", "Issuer (e.g. DataCamp)"],
          ["year", "Year"]
        ].forEach(([key, placeholder]) => {
          const inp = document.createElement("input");
          inp.type = "text";
          inp.value = cert[key] || "";
          inp.placeholder = placeholder;
          inp.oninput = () => {
            cert[key] = inp.value;
            onSync();
          };
          cRow.appendChild(inp);
        });
        cRow.appendChild(
          createIconButton(
            SVG_TRASH,
            "Remove certification",
            () => {
              sec.entries.splice(cIdx, 1);
              onSync();
              onReRender();
            },
            "btn-icon-only cert-del"
          )
        );
        box.appendChild(cRow);
      });
      sBody.append(
        box,
        createAddButton("Add certification", () => {
          sec.entries.push({ name: "New Certification", issuer: "Issuer", year: "" });
          onSync();
          onReRender();
        })
      );
    } else {
      const field = document.createElement("div");
      field.className = "field";
      const area = document.createElement("textarea");
      area.className = "summary-textarea";
      area.style.minHeight = "96px";
      area.value = sec.content;
      area.setAttribute("aria-label", sec.title || "Section content");
      area.oninput = () => {
        sec.content = area.value;
        onSync();
      };
      field.appendChild(area);
      sBody.appendChild(field);
    }
    container.appendChild(details);
  });

  // Dynamic Section Addition Bar
  const addSecWrap = document.createElement("div");
  addSecWrap.className = "entity-card add-section-bar";
  addSecWrap.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:12px;";

  const secTitleIn = document.createElement("input");
  secTitleIn.type = "text";
  secTitleIn.placeholder = "New Section Title (e.g. Awards, Publications)";
  secTitleIn.style.flex = "1";

  const secTypeSel = document.createElement("select");
  secTypeSel.setAttribute("aria-label", "New Section Type");
  [
    ["skills-grid", "Skills Grid", "Technical Skills"],
    ["exp-list", "Experience List", "Professional Experience"],
    ["project-list", "Projects List", "Key Projects"],
    ["education", "Education", "Education"],
    ["certifications", "Certifications", "Certifications & Training"],
    ["text-block", "Text Block", "Additional Information"]
  ].forEach(([val, lbl]) => {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = lbl;
    secTypeSel.appendChild(o);
  });

  const addSecBtn = createAddButton("Add section", () => {
    const type = secTypeSel.value;
    const defaultTitles = {
      "skills-grid": "Technical Skills",
      "exp-list": "Professional Experience",
      "project-list": "Key Projects",
      "education": "Education",
      "certifications": "Certifications & Training",
      "text-block": "Additional Information"
    };
    const title = secTitleIn.value.trim() || defaultTitles[type] || "New Section";
    const newSec = { title, type };
    if (type === "skills-grid") newSec.rows = [{ category: "Category", skills: "" }];
    else if (type === "text-block") newSec.content = "";
    else newSec.entries = [];
    parsed.sections.push(newSec);
    onSync();
    onReRender();
  });
  addSecBtn.style.marginTop = "0";
  addSecWrap.append(secTitleIn, secTypeSel, addSecBtn);
  container.appendChild(addSecWrap);
}

function renderCoverLetterForm(container, parsed, { onSync, onReRender }) {
  if (parsed.header && (parsed.header.name || parsed.header.title || parsed.header.email)) {
    container.appendChild(createContactSection(parsed.header, onSync));
  }

  if (parsed.hasDateMarker || parsed.dateStr || (parsed.recipientLines && parsed.recipientLines.length > 0)) {
    const { details: secMeta, body: mBody } = createSection("Date & Recipient");
    mBody.append(
      createField("Letter Date", parsed.dateStr, v => (parsed.dateStr = v), onSync),
      createField(
        "Recipient Address Block",
        (parsed.recipientLines || []).join("\n"),
        v => {
          parsed.recipientLines = v.split("\n").map(l => l.trim()).filter(Boolean);
        },
        onSync,
        true
      )
    );
    container.appendChild(secMeta);
  }

  const { details: secSalutation, body: salBody } = createSection("Salutation");
  salBody.appendChild(createField("Salutation", parsed.salutation, v => (parsed.salutation = v), onSync));
  container.appendChild(secSalutation);

  const { details: secBody, body: bBody } = createSection("Body Paragraphs");
  (parsed.paragraphs || []).forEach((pText, pIdx) => {
    const card = createEntityCard({
      titleText: `Paragraph #${pIdx + 1}`,
      deleteTitle: "Remove paragraph",
      onDelete: () => {
        parsed.paragraphs.splice(pIdx, 1);
        onSync();
        onReRender();
      },
      onSync,
      onReRender
    });
    const pField = document.createElement("div");
    pField.className = "field";
    const pArea = document.createElement("textarea");
    pArea.className = "summary-textarea";
    pArea.style.minHeight = "80px";
    pArea.value = pText;
    pArea.setAttribute("aria-label", `Paragraph ${pIdx + 1}`);
    pArea.oninput = () => {
      parsed.paragraphs[pIdx] = pArea.value;
      onSync();
    };
    pField.appendChild(pArea);
    card.appendChild(pField);
    bBody.appendChild(card);
  });

  bBody.appendChild(
    createAddButton("Add paragraph", () => {
      if (!parsed.paragraphs) parsed.paragraphs = [];
      parsed.paragraphs.push("New paragraph text.");
      onSync();
      onReRender();
    })
  );
  container.appendChild(secBody);

  const { details: secClosing, body: clBody } = createSection("Sign-off & Signature");
  const clGrid = document.createElement("div");
  clGrid.className = "grid-2";
  clGrid.append(
    createField("Valediction / Sign-off", parsed.valediction || "Sincerely,", v => (parsed.valediction = v), onSync),
    createField("Signer Name", parsed.signerName || (parsed.header ? parsed.header.name : ""), v => (parsed.signerName = v), onSync)
  );
  clBody.appendChild(clGrid);
  container.appendChild(secClosing);
}

function renderGenericForm(container, parsed, { onSync }) {
  const { details: sec, body } = createSection("Document Content");
  const note = document.createElement("p");
  note.style.cssText = "color:var(--muted);font-size:12px;";
  note.textContent = "Standard sections not detected. Use the content editor below or switch to Typst mode.";
  const field = document.createElement("div");
  field.className = "field";
  const area = document.createElement("textarea");
  area.className = "summary-textarea";
  area.style.minHeight = "360px";
  area.value = parsed.raw;
  area.setAttribute("aria-label", "Document content");
  area.oninput = () => {
    parsed.raw = area.value;
    if (onSync) onSync();
  };
  field.appendChild(area);
  body.append(note, field);
  container.appendChild(sec);
}

const StudioEditor = {
  createField,
  createEntityCard,
  moveSection,
  createContactSection,
  renderResumeForm,
  renderCoverLetterForm,
  renderGenericForm
};

if (typeof window !== "undefined") window.StudioEditor = StudioEditor;
if (typeof module !== "undefined" && module.exports) module.exports = StudioEditor;
