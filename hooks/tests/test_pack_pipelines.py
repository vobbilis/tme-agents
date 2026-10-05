#!/usr/bin/env python3
"""RED suite for pipeline-completeness fixes (external review round 3,
2026-10-04): every npm script a /cmo:* command tells the user to run must
exist, and the ASR pronunciation diagnostic must exist in ALL forms, not
just the explainer.

  1. footage package.json gains prepare:footage / prepare:focus (cuts.md
     already instructs `npm run prepare:footage`)
  2. diagram + footage packs gain scripts/transcribe-pronunciation.py and
     scripts/pronunciation.mjs (lesson 42 is form-agnostic), wired as
     `npm run pronunciation`. The hyperframes comparator reads the pack's
     own narrate outputs (assets/audio/NN-<id>.mp3 + voiceover.json) and
     compares against SCENES vo; there is NO alias table — spoken() in
     scenes.mjs is the alias mechanism in these forms.

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_pack_pipelines.py
"""

import json
import subprocess
from pathlib import Path

import pytest

PACKS = Path(__file__).resolve().parent.parent.parent / "packs"


def scripts_of(pack):
    return json.load(open(PACKS / pack / "machinery" / "package.json"))["scripts"]


def test_footage_prepare_scripts_exist():
    s = scripts_of("footage")
    assert s.get("prepare:footage") == "node scripts/prepare-footage.mjs"
    assert s.get("prepare:focus") == "node scripts/prepare-focus.mjs"
    # and the files they point at are really there
    for f in ("prepare-footage.mjs", "prepare-focus.mjs"):
        assert (PACKS / "footage" / "machinery" / "scripts" / f).exists()


@pytest.mark.parametrize("pack", ["diagram", "footage"])
def test_pronunciation_diagnostic_in_hyperframes_packs(pack):
    s = scripts_of(pack)
    assert s.get("pronunciation") == "node scripts/pronunciation.mjs"
    scripts_dir = PACKS / pack / "machinery" / "scripts"
    assert (scripts_dir / "pronunciation.mjs").exists()
    assert (scripts_dir / "transcribe-pronunciation.py").exists()
    # no reel-specific alias table came along
    text = (scripts_dir / "pronunciation.mjs").read_text()
    assert "SecOps" not in text and "Seck-ops" not in text
    assert "av==13.1.0" in text  # PyAV pin: newer av crashes faster-whisper 1.2.1
    # it is at least valid JS
    subprocess.run(["node", "--check", str(scripts_dir / "pronunciation.mjs")],
                   check=True, capture_output=True, timeout=30)


@pytest.mark.parametrize("pack", ["diagram", "footage"])
def test_pronunciation_refuses_plainly_without_narration(pack, tmp_path):
    # before narrate has run there is nothing to transcribe — the script
    # must say so in plain English, not stack-trace
    prod = tmp_path / "production"
    (prod / "scripts").mkdir(parents=True)
    scripts_dir = PACKS / pack / "machinery" / "scripts"
    (prod / "scripts" / "pronunciation.mjs").write_text((scripts_dir / "pronunciation.mjs").read_text())
    (prod / "scenes.mjs").write_text("export const FILM={fps:30}\nexport const SCENES=[]\n")
    out = subprocess.run(["node", str(prod / "scripts" / "pronunciation.mjs")],
                         capture_output=True, text=True, timeout=30, cwd=prod)
    assert out.returncode != 0
    assert "narrate" in (out.stdout + out.stderr)
    assert "    at " not in (out.stdout + out.stderr)  # no stack frames


@pytest.mark.parametrize("pack", ["diagram", "footage"])
def test_review_draft_render_path(pack):
    # fix for the fix-6 deadlock: render:review produces an UNSHIPPABLE
    # draft under out/review/ without the approval marker
    s = scripts_of(pack)
    assert s.get("render:review") == "node scripts/render.mjs --review-draft"
    render = (PACKS / pack / "machinery" / "scripts" / "render.mjs").read_text()
    assert "--review-draft" in render and "out/review" in render
    finish = (PACKS / pack / "machinery" / "scripts" / "finish.mjs").read_text()
    assert "out/review" in finish  # finish refuses review drafts
    for f in ("render.mjs", "finish.mjs"):
        subprocess.run(["node", "--check", str(PACKS / pack / "machinery" / "scripts" / f)],
                       check=True, capture_output=True, timeout=30)
