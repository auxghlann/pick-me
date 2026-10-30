// Modern Clean ATS-Optimized Resume Template
// Single-column layout engineered for strict 1-page geometry and high ATS parser fidelity

#set page(
  paper: "a4",
  margin: (x: 1.35cm, top: 0.8cm, bottom: 0.8cm),
)

#set text(
  font: ("Segoe UI", "Arial"),
  size: 8.8pt,
  fill: rgb("#111827"),
  lang: "en",
)

#set par(justify: false, leading: 0.45em)

// Style definitions
#let section-title(title) = {
  v(3.5pt)
  text(weight: "bold", size: 9.8pt, upper(title))
  v(-3.5pt)
  line(length: 100%, stroke: 0.5pt + rgb("#d1d5db"))
  v(1.5pt)
}

#let exp-entry(title: "", company: "", location: "", date: "", bullets: ()) = {
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
}

#let project-entry(name: "", stack: "", date: "", bullets: ()) = {
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
}

// Header
#align(center)[
  #text(size: 18pt, weight: "bold")[NAME_PLACEHOLDER] \
  #v(1.5pt)
  #text(size: 10pt, weight: "medium", fill: rgb("#374151"))[TITLE_PLACEHOLDER] \
  #v(2.5pt)
  #text(size: 8.5pt, fill: rgb("#4b5563"))[
    LOCATION_PLACEHOLDER | 
    #link("mailto:EMAIL_PLACEHOLDER")[EMAIL_DISPLAY_PLACEHOLDER] | 
    PHONE_PLACEHOLDER | 
    #link("LINKEDIN_URL_PLACEHOLDER")[LinkedIn] | 
    #link("GITHUB_URL_PLACEHOLDER")[GitHub]
  ]
]

// Professional Summary
#section-title("Professional Summary")
SUMMARY_PLACEHOLDER

// Technical Skills
#section-title("Technical Skills")
#grid(
  columns: (auto, 1fr),
  column-gutter: 8pt,
  row-gutter: 3pt,
  SKILLS_BLOCK_PLACEHOLDER
)

// Professional Experience
#section-title("Professional Experience")
EXPERIENCE_BLOCK_PLACEHOLDER

// Key Projects
#section-title("Key Projects")
PROJECTS_BLOCK_PLACEHOLDER

// Education
#section-title("Education")
EDUCATION_BLOCK_PLACEHOLDER

// Certifications & Training
#section-title("Certifications & Training")
CERTIFICATIONS_BLOCK_PLACEHOLDER