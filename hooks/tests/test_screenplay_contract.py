#!/usr/bin/env python3
"""RED suite for finding 9: the screenplay format CONTRACT between the lint
(producer side: /cmo:screenplay writes this format) and each pack's scene
parser (consumer side: the machinery builds the film from it).

Found live 2026-10-04: the lint and the footage pack's scenes.mjs read two
different languages, so a lint-clean screenplay could not drive the
machinery (and the lint passed vacuously on the pack's own format). The fix
makes the LINT FORMAT CANONICAL and teaches the pack skeletons to parse it:

  packs/footage/templates/scenes.skeleton.mjs
      parses `## S<nn>. <Title>` scenes with `Slot: mm:ss-mm:ss`,
      `Points:` (the right-panel conclusions), `Narration:` (`>` lines,
      [src:]/[CHECK] TAGS STRIPPED — tags must never reach TTS), and
      `Cues:` (one per point, in order, FROM THE MARKDOWN — no more
      hand-kept cue arrays in JS). Scene count derives from the file.

  packs/explainer/templates/story.skeleton.mjs
      parseScript() accepts `## S01. Title` headings (with or without the
      S/zero padding) and strips [src:]/[CHECK] tags from vo.

These tests drive the actual skeleton .mjs files under node against
lint-format fixtures, and assert the lint accepts the same fixtures — one
contract, two consumers, verified from both sides.

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_screenplay_contract.py
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

PLUGIN = Path(__file__).resolve().parent.parent.parent
LINT = PLUGIN / "scripts" / "screenplay_lint.py"
FOOTAGE_SKELETON = PLUGIN / "packs" / "footage" / "templates" / "scenes.skeleton.mjs"
EXPLAINER_SKELETON = PLUGIN / "packs" / "explainer" / "templates" / "story.skeleton.mjs"


FOOTAGE_FIXTURE = """# Contract fixture

## S01. The Question We Keep Hearing
Slot: 00:00-00:45
Theme: dark
Points:
- One platform, not two
- Same control plane
Narration:
> Are we building a second platform? [src:owner-memo-01]
> The answer is no, and here is the proof. [src:owner-checks-01]
Cues:
- building a second platform
- here is the proof

## S02. The Existing Code Changes The Answer
Slot: 00:45-01:30
Status: PROPOSED RETURN HANDOFF
Points:
- Starts from the system
Narration:
> The team starts from the running system. [src:owner-memo-02]
Cues:
- starts from the running system
"""


def run_node_scenes(tmp_path, fixture):
    """Scaffold a mini reel, run the footage skeleton under node, return SCENES."""
    prod = tmp_path / "production"
    prod.mkdir()
    (prod / "scenes.mjs").write_text(FOOTAGE_SKELETON.read_text())
    (tmp_path / "STORYBOARD_REVIEW.md").write_text(fixture)
    out = subprocess.run(
        ["node", "-e",
         "import(process.argv[1]).then(m => console.log(JSON.stringify(m.SCENES)))"
         .replace("\n", " "),
         str(prod / "scenes.mjs")],
        capture_output=True, text=True, timeout=60)
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def test_lint_accepts_the_contract_fixture(tmp_path):
    f = tmp_path / "SP.md"
    f.write_text(FOOTAGE_FIXTURE)
    proc = subprocess.run([sys.executable, str(LINT), str(f), "--cues-per-point"],
                          capture_output=True, text=True, timeout=30)
    assert proc.returncode == 0, proc.stdout


def test_footage_skeleton_parses_lint_format(tmp_path):
    scenes = run_node_scenes(tmp_path, FOOTAGE_FIXTURE)
    assert [s["id"] for s in scenes] == ["s01", "s02"]
    assert scenes[0]["title"] == "The Question We Keep Hearing"
    assert scenes[0]["slotSeconds"] == 45
    assert scenes[1]["programStart"] == 45
    # points paired with cues, in order, from the MARKDOWN
    assert [p["text"] for p in scenes[0]["points"]] == ["One platform, not two", "Same control plane"]
    assert [p["cue"] for p in scenes[0]["points"]] == ["building a second platform", "here is the proof"]


def test_master_duration_derives_from_slots(tmp_path):
    # finding 10a: the master length comes from the screenplay's final Slot,
    # not a hardcoded 900 — /cmo:new's asked length is honoured
    prod = tmp_path / "production"
    prod.mkdir()
    (prod / "scenes.mjs").write_text(FOOTAGE_SKELETON.read_text())
    (tmp_path / "STORYBOARD_REVIEW.md").write_text(FOOTAGE_FIXTURE)
    out = subprocess.run(
        ["node", "-e",
         "import(process.argv[1]).then(m => console.log(m.FILM.minimumDurationSeconds))",
         str(prod / "scenes.mjs")],
        capture_output=True, text=True, timeout=60)
    assert out.returncode == 0, out.stderr
    assert out.stdout.strip() == "90"  # S02 ends at 01:30


def test_theme_and_status_come_from_the_screenplay(tmp_path):
    # the reference reel's DARK_SCENES/PROPOSAL_SCENE constants are gone:
    # the screenplay says which scenes are dark and which carry a status
    scenes = run_node_scenes(tmp_path, FOOTAGE_FIXTURE)
    assert scenes[0]["theme"] == "dark"
    assert scenes[1]["theme"] == "light"
    assert scenes[1]["status"] == "PROPOSED RETURN HANDOFF"
    assert "RECORDED EXCERPTS" in scenes[0]["status"]


def test_footage_vo_is_tag_free_and_joined(tmp_path):
    scenes = run_node_scenes(tmp_path, FOOTAGE_FIXTURE)
    vo = scenes[0]["vo"]
    assert "[src:" not in vo and "[CHECK]" not in vo, vo  # tags must never reach TTS
    assert "second platform?" in vo and "here is the proof." in vo  # all lines joined


def test_footage_skeleton_rejects_point_cue_mismatch(tmp_path):
    broken = FOOTAGE_FIXTURE.replace("- here is the proof\n", "")
    prod = tmp_path / "production"
    prod.mkdir()
    (prod / "scenes.mjs").write_text(FOOTAGE_SKELETON.read_text())
    (tmp_path / "STORYBOARD_REVIEW.md").write_text(broken)
    out = subprocess.run(
        ["node", "-e", "import(process.argv[1]).then(() => {})", str(prod / "scenes.mjs")],
        capture_output=True, text=True, timeout=60)
    assert out.returncode != 0
    assert "S01" in out.stderr or "s01" in out.stderr


def _explainer_script(sections=10):
    parts = ["# Fixture script\n"]
    for n in range(1, sections + 1):
        parts.append(f"## S{n:02d}. Chapter {n} Title\n\n"
                     f"> Sentence one of chapter {n}. [src:owner-memo-01]\n"
                     f"> Sentence two of chapter {n}. [src:owner-checks-01]\n")
    return "\n".join(parts)


def test_explainer_parser_accepts_lint_headings_and_strips_tags(tmp_path):
    prod = tmp_path / "production"
    (prod / "lib").mkdir(parents=True)
    (prod / "lib" / "narrator.mjs").write_text("export const RATE='+2%'\nexport const VOICE='x'\n")
    (prod / "story.mjs").write_text(EXPLAINER_SKELETON.read_text())
    (tmp_path / "SCRIPT.md").write_text(_explainer_script(10))
    out = subprocess.run(
        ["node", "-e",
         "import(process.argv[1]).then(m => console.log(JSON.stringify(m.SCENES.map(s => s.vo))))",
         str(prod / "story.mjs")],
        capture_output=True, text=True, timeout=60)
    assert out.returncode == 0, out.stderr
    vos = json.loads(out.stdout)
    assert len(vos) == 10
    assert all("[src:" not in vo and "[CHECK]" not in vo for vo in vos)
    assert "Sentence one of chapter 1." in vos[0]
