#!/usr/bin/env python3
"""RED suite for the failure translator (build step 4, 2026-10-04).

Script under test (does not exist yet):
  ~/.claude/plugins/cmo-plugin/scripts/translate_failure.py

/cmo:assemble pipes every failed pipeline step's output through this so the
owner reads plain English with a fix location, never a stack trace.

Contract (this file IS the spec for GREEN):

  python3 translate_failure.py [--step NAME] < raw-error-text
      exit 0: a rule matched; stdout is 1-3 plain-English lines naming
              what to change and where. No stack-trace lines, no 'at ...'
              frames, in the output.
      exit 3: nothing matched; stdout is a one-line generic header naming
              the step; the raw text is NOT echoed (the command decides
              what to show).

  Rules it must cover (keyed on the real pipelines' messages):
    - cue problems ("missing narration cue: X", "cue ... resolves N
      times") -> name the cue, say the phrase must occur exactly once,
      point at the screenplay/scene file
    - "Script must have exactly N sections" -> SCRIPT.md section count
    - "Incomplete preservation receipt" -> inputs not frozen; /cmo:brief
    - silent tails ("leaves long silent tails", "tail ... exceeds") ->
      add a sentence or trim
    - ENOENT with a path -> name the missing file plainly
    - "command not found" -> name the tool and say install it
    - pronunciation/ASR mismatch -> suggest a speech-only hint
    - duration guard ("duration ... exceeds MAX_DURATION" or "film is
      NNN s; brief allows") -> cut or raise the brief limit

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_translate_failure.py
"""

import subprocess
import sys
from pathlib import Path

TOOL = Path(__file__).resolve().parent.parent.parent / "scripts" / "translate_failure.py"


def run(text, *args):
    proc = subprocess.run([sys.executable, str(TOOL), *args],
                          input=text, capture_output=True, text=True, timeout=30)
    return proc.returncode, proc.stdout


def test_missing_cue(tmp_path):
    raw = """file:///x/production/lib/speech.mjs:69
Error: missing narration cue: shared security harness
    at findCue (file:///x/production/lib/speech.mjs:69:30)
    at Array.map (<anonymous>)"""
    code, out = run(raw)
    assert code == 0
    assert "shared security harness" in out
    assert "exactly once" in out
    assert "at findCue" not in out and "file:///" not in out


def test_cue_resolves_twice(tmp_path):
    code, out = run("Error: cue 'the running system' resolves 2 times in scene 11")
    assert code == 0
    assert "the running system" in out and "exactly once" in out


def test_section_count(tmp_path):
    code, out = run("Error: Script must have exactly 10 sections\n    at file:///x/story.mjs:55:45")
    assert code == 0
    assert "SCRIPT.md" in out and "10" in out
    assert "story.mjs:55" not in out


def test_incomplete_receipt(tmp_path):
    code, out = run("Error: Incomplete preservation receipt: missing entries for memo, script")
    assert code == 0
    assert "cmo:brief" in out


def test_silent_tails(tmp_path):
    code, out = run("Error: Narration pace leaves long silent tails (avg 2.31s)")
    assert code == 0
    assert "sentence" in out.lower() or "trim" in out.lower()


def test_enoent(tmp_path):
    code, out = run("Error: ENOENT: no such file or directory, open '/x/reel/production/assets/manifest.json'")
    assert code == 0
    assert "assets/manifest.json" in out
    assert "ENOENT" not in out


def test_command_not_found(tmp_path):
    code, out = run("/bin/sh: xmllint: command not found")
    assert code == 0
    assert "xmllint" in out and "install" in out.lower()


def test_pronunciation(tmp_path):
    code, out = run("pronunciation mismatch: expected 'SecOps' heard 'Secretary Ops' at 0:39")
    assert code == 0
    assert "speech-only" in out.lower() or "hint" in out.lower()


def test_duration_guard(tmp_path):
    code, out = run("Error: duration 376.2s exceeds MAX_DURATION 360")
    assert code == 0
    assert "brief" in out.lower()


def test_unmatched_exits_3(tmp_path):
    code, out = run("Error: flux capacitor underflow at 88mph", "--step", "build")
    assert code == 3
    assert "build" in out
    assert "flux capacitor" not in out  # raw text is not echoed
