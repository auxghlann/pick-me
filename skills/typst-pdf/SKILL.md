---
name: typst-pdf
description: Generic markup assembly and PDF compilation utility using the Typst CLI. Handles document geometry, full justification, typography standards, and error-free PDF compilation for any arbitrary document. Zero domain or business logic.
---

# Typst PDF Compilation

Compiles `.typ` source files into PDFs using the Typst engine.

## Tooling & Compilation

### Verifying CLI
Verify installation via `typst --version`. If missing, request user confirmation before installing:
```powershell
winget install -e --id Typst.Typst
```

### Compiling Documents
Execute the bundled compilation script:
```powershell
powershell -ExecutionPolicy Bypass -File "skills/typst-pdf/scripts/compile.ps1" -TypstFile "<path/to/source.typ>" -OutputFile "<path/to/target.pdf>"
```
- If `-OutputFile` is omitted, the script writes `<source_basename>.pdf` in the source directory.
- The script automatically creates missing target directories.
- Always verify the generated PDF exists and has non-zero bytes.

## Typst Markup Standards & Syntax Traps

Adhere to these rules when authoring or editing `.typ` source:

1. **Document Geometry**:
   ```typst
   #set page(paper: "a4", margin: (x: 1.8cm, top: 1.8cm, bottom: 1.8cm))
   ```
2. **Typography**: Always declare universal fallback fonts to prevent substitution errors:
   ```typst
   #set text(font: ("Segoe UI", "Arial"), size: 10pt, fill: rgb("#111827"), lang: "en")
   ```
3. **Paragraph Justification**:
   ```typst
   #set par(justify: true, leading: 0.65em)
   ```
4. **Escaping Emails & URLs (Crucial)**:
   In Typst markup, `@` denotes a label or bibliography reference. Unescaped `@` (e.g. `user@example.com`) causes label resolution failures. Always wrap:
   - Emails: `#link("mailto:name@example.com")[name@example.com]` or `#text("name@example.com")`
   - URLs: `#link("https://example.com")[example.com]`
5. **Layout Primitives**:
   - Vertical/horizontal spacing: `#v(8pt)`, `#h(6pt)`
   - Dividers: `#line(length: 100%, stroke: 0.5pt + rgb("#d1d5db"))`
   - Key-value or multi-column grids: `#grid(columns: (1fr, auto), ...)`
