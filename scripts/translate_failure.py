#!/usr/bin/env python3
"""Failure translator for /cmo:assemble (build step 4).

The owner never reads a stack trace: every failed pipeline step's output is
piped through here. A matched rule prints 1-3 plain-English lines naming
what to change and where (exit 0). An unmatched failure prints only a
generic one-line header naming the step (exit 3) — the COMMAND decides how
much raw text to show, this tool never echoes it.

  python3 translate_failure.py [--step NAME] < raw-error-text

Plain python3 + stdlib. Contract pinned by
hooks/tests/test_translate_failure.py — change that first.
"""

import argparse
import re
import sys

RULES = [
    (re.compile(r"missing narration cue: (.+)"),
     lambda m: f"The cue phrase “{m.group(1).strip()}” does not appear in the narration. "
               "Every cue must occur exactly once in its scene's spoken text — "
               "fix the phrase in the screenplay (or the scene file) so the words match verbatim."),
    (re.compile(r"cue '([^']+)' resolves (\d+) times"),
     lambda m: f"The cue phrase “{m.group(1)}” appears {m.group(2)} times in that scene's narration; "
               "it must occur exactly once. Pick a longer, unique phrase in the screenplay."),
    (re.compile(r"Script must have exactly (\d+) sections"),
     lambda m: f"SCRIPT.md does not have the expected {m.group(1)} sections. "
               f"Add or merge sections until exactly {m.group(1)} '## n. Title' headings remain."),
    (re.compile(r"Incomplete preservation receipt"),
     lambda m: "The inputs are not frozen yet — the source receipt is missing entries. "
               "Run /cmo:brief to register every source and prior film before building."),
    (re.compile(r"(leaves long silent tails|tail .* exceeds|avg tail)", re.I),
     lambda m: "A scene ends with too much silence after the narration. "
               "Add one more sentence to that scene, or trim its footage/holding time."),
    (re.compile(r"duration .*(exceeds|above) MAX_DURATION|film is [\d.]+\s*s.*brief", re.I),
     lambda m: "The film is longer than the brief allows. "
               "Cut material, or raise the length limit in BRIEF.md with the owner."),
    (re.compile(r"ENOENT[^']*'([^']+)'"),
     lambda m: f"A file the pipeline expects is missing: {m.group(1)}. "
               "Restore it (or re-run the step that generates it) and try again."),
    (re.compile(r"(?:^|[\s:])([\w-]+): command not found", re.M),
     lambda m: f"The tool “{m.group(1)}” is not installed on this machine. "
               f"Install it (brew install {m.group(1)}) and re-run."),
    (re.compile(r"pronunciation|heard '([^']*)'", re.I),
     lambda m: "The narrator mispronounces a word. Add a speech-only hint for it "
               "(spoken() in the scene file keeps the caption spelling unchanged) and re-synthesize that section."),
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--step", default="pipeline")
    args = ap.parse_args()
    raw = sys.stdin.read()

    for pattern, render in RULES:
        m = pattern.search(raw)
        if m:
            print(render(m))
            sys.exit(0)

    print(f"The {args.step} step failed for a reason this toolkit has no translation for yet.")
    sys.exit(3)


if __name__ == "__main__":
    main()
