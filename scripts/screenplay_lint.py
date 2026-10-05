#!/usr/bin/env python3
"""Screenplay lint for /cmo:screenplay (build step 3).

/cmo:screenplay runs this over the screenplay BEFORE showing any scene
group to the owner, and over marketing-fact-checker output (--dispositions)
before merging it into REVIEW_DISPOSITIONS.md. Prompts guide; this code
enforces the machine-checkable slice of the story-craft rules:

  claims-untagged     every narration line ends [src:<id>] or [CHECK]
  label-taxonomy      Labels: entries come from the lesson-41 taxonomy
  organization-first  no lesson-40 audit items in narration (hashes,
                      PR/test/commit counts, file paths, "we are leading")
  banned-word         no promo vocabulary
  cue-length          cues are 3-6 words (lesson 16)
  cue-match           each cue occurs exactly once in its scene's narration
  points              <= --max-points per scene, each <= --max-point-chars
  title-length        scene titles <= 45 chars
  no-scenes           a file with zero parseable scenes is a finding, never OK
  slot-format         Slot: (optional) must be mm:ss-mm:ss when present
  theme-value         Theme: (optional) must be dark or light
  (Status: is free text — the amber on-screen status strip, e.g.
   PROPOSED RETURN HANDOFF; theme and status are editorial decisions
   made in the screenplay, never constants)
  cues-per-point      with --cues-per-point: one cue per point, in order

Exit 0 = clean, 1 = findings (one per line, or --json), 2 = unreadable.
Plain python3 + stdlib. Contract pinned by
hooks/tests/test_screenplay_lint.py — change that first.
"""

import argparse
import json
import re
import sys

SCENE_RE = re.compile(r"^## (S\d+)\. (.*)$")
TAG_RE = re.compile(r"\[(?:src:[^\]]+|CHECK)\]\s*$")
TAG_ANY_RE = re.compile(r"\[(?:src:[^\]]+|CHECK)\]")

ALLOWED_LABELS = {
    "CURRENT REPOSITORY SNAPSHOT",
    "MERGED IN THE TWIN",
    "WORKING PROTOTYPE",
    "APPROVED PROPOSAL · NOT SHIPPED",
    "IMPLEMENTED PROPOSAL · UNDER REVIEW",
    "OPEN · NOT YET RUN",
    "Operating-model illustration",
}
ALLOWED_LABEL_PREFIXES = ("HYPOTHETICAL ·",)

LESSON_40 = [
    (re.compile(r"\b[0-9a-f]{7,40}\b"), "commit hash"),
    (re.compile(r"\b\d+\s+(?:PRs?|pull requests?|commits?|tests?)\b", re.I), "a PR/test/commit count"),
    (re.compile(r"\b[\w.-]+/[\w.-]+\.(?:py|mjs|cjs|js|ts|tsx|json|ya?ml|sh|go|rs)\b"), "a file path"),
    (re.compile(r"\bwe(?: are|'re|’re)\s+(?:leading|mature|unusually active)\b", re.I), "a self-assessment"),
]

BANNED_WORDS = [
    "seamless", "revolutionary", "game-changing", "game changing",
    "best-in-class", "world-class", "cutting-edge", "state-of-the-art",
    "effortless", "magical", "blazing",
]

TITLE_MAX = 45


def parse_scenes(text):
    scenes = []
    current = None
    section = None
    for raw in text.splitlines():
        line = raw.rstrip()
        m = SCENE_RE.match(line)
        if m:
            current = {"id": m.group(1), "title": m.group(2).strip(), "slot": None,
                       "theme": None, "status": None,
                       "labels": [], "points": [], "narration": [], "cues": []}
            scenes.append(current)
            section = None
            continue
        if current is None:
            continue
        if line.startswith("Slot:"):
            current["slot"] = line[len("Slot:"):].strip()
            section = None
        elif line.startswith("Theme:"):
            current["theme"] = line[len("Theme:"):].strip()
            section = None
        elif line.startswith("Status:"):
            current["status"] = line[len("Status:"):].strip()
            section = None
        elif line.startswith("Labels:"):
            current["labels"] = [l.strip() for l in line[len("Labels:"):].split(",") if l.strip()]
            section = None
        elif line.strip() == "Points:":
            section = "points"
        elif line.strip() == "Narration:":
            section = "narration"
        elif line.strip() == "Cues:":
            section = "cues"
        elif line.startswith(">"):
            current["narration"].append(line[1:].strip())
        elif line.startswith("- ") and section in ("points", "cues"):
            current[section].append(line[2:].strip())
        elif line.strip() == "":
            continue
        else:
            section = None
    return scenes


SLOT_RE = re.compile(r"^\d{2}:\d{2}-\d{2}:\d{2}$")


def lint_screenplay(text, max_points, max_point_chars, cues_per_point=False):
    findings = []

    def add(rule, scene, detail):
        findings.append({"rule": rule, "scene": scene, "detail": detail})

    scenes = parse_scenes(text)
    if not scenes:
        add("no-scenes", "-",
            "no '## S<nn>. <Title>' scenes found — either the file is empty of scenes "
            "or it is written in a different format this lint cannot read; a pass over "
            "zero scenes proves nothing")
        return findings

    for scene in scenes:
        sid = scene["id"]
        if len(scene["title"]) > TITLE_MAX:
            add("title-length", sid, f"title is {len(scene['title'])} chars (max {TITLE_MAX}): {scene['title'][:50]}…")

        for label in scene["labels"]:
            if label not in ALLOWED_LABELS and not label.startswith(ALLOWED_LABEL_PREFIXES):
                add("label-taxonomy", sid,
                    f"'{label}' is not in the status-label taxonomy (lesson 41); "
                    f"use one of: {', '.join(sorted(ALLOWED_LABELS))}, or HYPOTHETICAL · <question>")

        clean_lines = []
        for line in scene["narration"]:
            if not line:
                continue
            if not TAG_RE.search(line):
                add("claims-untagged", sid,
                    f"narration line has no [src:<id>] or [CHECK] tag: '{line[:60]}' — every substantive line traces to the owner or stops for confirmation")
            clean_lines.append(TAG_ANY_RE.sub("", line).strip())
        narration = " ".join(clean_lines)

        for pattern, what in LESSON_40:
            m = pattern.search(narration)
            if m:
                add("organization-first", sid,
                    f"narration carries {what} ('{m.group(0)}') — the lesson-40 ban list: lead with the organizational change, never the audit")
        low = narration.lower()
        for word in BANNED_WORDS:
            if word in low:
                add("banned-word", sid, f"'{word}' is promo vocabulary — show it, don't say it")

        for cue in scene["cues"]:
            words = len(cue.split())
            if not 3 <= words <= 6:
                add("cue-length", sid, f"cue '{cue}' is {words} words (needs 3-6; lesson 16)")
            count = narration.lower().count(cue.lower())
            if count != 1:
                add("cue-match", sid,
                    f"cue '{cue}' occurs {count} times in this scene's narration (must be exactly once)")

        if scene["theme"] is not None and scene["theme"] not in ("dark", "light"):
            add("theme-value", sid, f"Theme '{scene['theme']}' must be dark or light")

        if scene["slot"] is not None and not SLOT_RE.match(scene["slot"]):
            add("slot-format", sid, f"Slot '{scene['slot']}' is not mm:ss-mm:ss")

        if cues_per_point and len(scene["cues"]) != len(scene["points"]):
            add("cues-per-point", sid,
                f"{len(scene['points'])} points but {len(scene['cues'])} cues — footage pairs each right-panel point with exactly one cue, in order")

        if len(scene["points"]) > max_points:
            add("points", sid, f"{len(scene['points'])} points (max {max_points}) — conclusions, not a transcript")
        for point in scene["points"]:
            if len(point) > max_point_chars:
                add("points", sid, f"point is {len(point)} chars (max {max_point_chars}): '{point[:40]}…'")

    return findings


def lint_dispositions(text):
    findings = []
    rows = [l for l in text.splitlines() if l.strip().startswith("|")]
    header_idx = None
    for i, row in enumerate(rows):
        cells = [c.strip() for c in row.strip().strip("|").split("|")]
        if cells[:3] == ["Finding", "Resolution", "Evidence"]:
            header_idx = i
            break
    if header_idx is None:
        return [{"rule": "dispositions", "scene": "-",
                 "detail": "no | Finding | Resolution | Evidence | header — fact-checker output must be a dispositions table"}]
    for row in rows[header_idx + 1:]:
        cells = [c.strip() for c in row.strip().strip("|").split("|")]
        if all(set(c) <= {"-", ":", " "} for c in cells):
            continue  # separator row
        if len(cells) < 3 or not all(cells[:3]):
            findings.append({"rule": "dispositions", "scene": "-",
                             "detail": f"row needs three non-empty cells: {row.strip()[:60]}"})
            continue
        if not re.search(r"S\d+", cells[0]):
            findings.append({"rule": "dispositions", "scene": "-",
                             "detail": f"Finding does not name a scene (S<n>): '{cells[0][:60]}'"})
    return findings


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("file", nargs="?")
    ap.add_argument("--dispositions", metavar="FILE")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--max-points", type=int, default=3)
    ap.add_argument("--max-point-chars", type=int, default=34)
    ap.add_argument("--cues-per-point", action="store_true",
                    help="require one cue per point (footage form)")
    args = ap.parse_args()

    path = args.dispositions or args.file
    if not path:
        ap.error("a screenplay file or --dispositions FILE is required")
    try:
        text = open(path).read()
    except OSError as e:
        print(f"cannot read {path}: {e}", file=sys.stderr)
        sys.exit(2)

    if args.dispositions:
        findings = lint_dispositions(text)
    else:
        findings = lint_screenplay(text, args.max_points, args.max_point_chars, args.cues_per_point)

    if args.json:
        print(json.dumps(findings, indent=2))
    else:
        for f in findings:
            print(f"{f['rule']} {f['scene']}: {f['detail']}")
        if not findings:
            print("OK")
    sys.exit(1 if findings else 0)


if __name__ == "__main__":
    main()
