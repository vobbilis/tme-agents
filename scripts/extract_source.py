#!/usr/bin/env python3
"""Document-source extractor for /cmo:brief.

Turns a PDF or PowerPoint file into a plain-text sidecar with page/slide
anchors, so narration can cite [src:doc-<id>-p<n>] and the fact-checker can
check a claim against the exact source that was frozen. The extract opens
with the source file's sha256 — the same hash the preservation receipt
holds — binding every citation to one exact document.

Run through a pinned environment (the session does this for the owner):

  uvx --with pypdf==6.19.0 --with python-pptx==1.0.2 python3 \\
      scripts/extract_source.py <file.pdf|.pptx> --output <extract.md>

Exit 0 + one-line summary. Exit 1 with a plain sentence (never a
traceback) when the file is missing, unsupported, or unreadable.
Contract pinned by hooks/tests/test_extract_source.py — change that first.
"""

import argparse
import hashlib
import sys
from pathlib import Path


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_pdf(path):
    try:
        from pypdf import PdfReader
    except ImportError:
        fail("The PDF reader is not installed — run this through uvx as the header of this script shows.")
    try:
        reader = PdfReader(path)
    except Exception:
        fail(f"{path.name} could not be opened as a PDF — is it encrypted or damaged?")
    sections = []
    for n, page in enumerate(reader.pages, 1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        sections.append((f"Page {n}", text.strip()))
    return sections


def extract_pptx(path):
    try:
        from pptx import Presentation
    except ImportError:
        fail("The PowerPoint reader is not installed — run this through uvx as the header of this script shows.")
    try:
        deck = Presentation(path)
    except Exception:
        fail(f"{path.name} could not be opened as a PowerPoint file — is it damaged or an old .ppt?")
    sections = []
    for n, slide in enumerate(deck.slides, 1):
        parts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                text = shape.text_frame.text.strip()
                if text:
                    parts.append(text)
            if getattr(shape, "has_table", False) and shape.has_table:
                for row in shape.table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    parts.append(" | ".join(c for c in cells if c))
        notes = getattr(slide, "notes_slide", None)
        if slide.has_notes_slide and notes and notes.notes_text_frame.text.strip():
            parts.append("(speaker notes) " + notes.notes_text_frame.text.strip())
        sections.append((f"Slide {n}", "\n\n".join(parts)))
    return sections


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source")
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    src = Path(args.source)
    if not src.is_file():
        fail(f"{src} does not exist — check the path (watch for the invisible space in macOS file names).")
    suffix = src.suffix.lower()
    if suffix == ".pdf":
        sections = extract_pdf(src)
    elif suffix == ".pptx":
        sections = extract_pptx(src)
    else:
        fail(f"{src.name} is not a type this extractor reads — it takes .pdf and PowerPoint .pptx files. "
             "For anything else, export to PDF first.")

    digest = sha256(src)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# Extract of {src.name}",
        "",
        f"- source: {src.name}",
        f"- sha256: {digest}",
        f"- sections: {len(sections)}",
        "",
        "This file is DERIVED and regenerable; the receipt freezes the",
        "original. Citations use the section anchors below.",
        "",
    ]
    empty = 0
    for title, text in sections:
        lines.append(f"## {title}")
        lines.append("")
        lines.append(text if text else "(no extractable text on this section)")
        lines.append("")
        if not text:
            empty += 1
    out.write_text("\n".join(lines))
    note = f" ({empty} with no extractable text — scans or pure images need a different route)" if empty else ""
    print(f"{src.name}: {len(sections)} sections -> {out}{note}")


if __name__ == "__main__":
    main()
