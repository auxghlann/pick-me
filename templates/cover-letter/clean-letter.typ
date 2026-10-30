// Clean Professional Cover Letter Template

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

#set par(justify: true, leading: 0.7em)

// Header
#text(size: 20pt, weight: "bold")[CANDIDATE_NAME] \
#v(2pt)
#text(size: 12pt, fill: rgb("#374151"))[CANDIDATE_TITLE] \
#v(4pt)
#text(size: 9pt, fill: rgb("#4b5563"))[
  CANDIDATE_LOCATION | 
  #link("mailto:CANDIDATE_EMAIL")[CANDIDATE_EMAIL_DISPLAY] | 
  CANDIDATE_PHONE | 
  #link("CANDIDATE_LINKEDIN")[LinkedIn] | 
  #link("CANDIDATE_GITHUB")[GitHub]
]

#v(8pt)
#line(length: 100%, stroke: 0.8pt + rgb("#e5e7eb"))
#v(12pt)

// Date & Recipient
DATE_PLACEHOLDER

#v(8pt)
*Hiring Team* \
COMPANY_NAME \
COMPANY_LOCATION

#v(14pt)

Dear Hiring Team,

BODY_PARAGRAPHS_PLACEHOLDER

#v(18pt)
Sincerely, \
#v(16pt)
*CANDIDATE_NAME*