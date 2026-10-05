#!/usr/bin/env python3
"""RED suite for the screenplay lint (build step 3, 2026-10-04).

One script under test. It does not exist yet — every test here must FAIL
until GREEN builds it:

  ~/.claude/plugins/cmo-plugin/scripts/screenplay_lint.py

/cmo:screenplay runs this lint over the screenplay BEFORE showing any scene
group to the owner, and over marketing-fact-checker output before merging it
into REVIEW_DISPOSITIONS.md. Prompts guide; this code enforces — same split
as the H1-H6 hooks.

Contract pinned by these tests (this file IS the spec for GREEN):

  CLI:  python3 screenplay_lint.py <screenplay.md> [--json]
                                   [--max-points N] [--max-point-chars N]
        python3 screenplay_lint.py --dispositions <file.md>
  exit 0 = clean (prints OK unless --json), exit 1 = findings
  (one per line: "<rule> <scene>: <detail>", or a JSON array with --json),
  exit 2 = file unreadable

  Screenplay format it lints (defined by /cmo:screenplay):
    ## S01. <Title ≤45 chars>
    Labels: <maturity labels, comma-separated>       (optional)
    Points:                                          (optional)
    - <conclusion, ≤34 chars by default>
    Narration:
    > <sentence(s)> [src:<id>]     — or —    > <sentence(s)> [CHECK]
    Cues:
    - <3-7 word phrase copied verbatim from this scene's narration>

  Rules:
    claims-untagged   every non-empty narration line ends with [src:<id>]
                      or [CHECK] (the claims rule; lesson 4 / P2a)
    label-taxonomy    Labels: entries must be in the lesson-41 taxonomy
                      (CURRENT REPOSITORY SNAPSHOT, MERGED IN THE TWIN,
                      WORKING PROTOTYPE, APPROVED PROPOSAL · NOT SHIPPED,
                      IMPLEMENTED PROPOSAL · UNDER REVIEW, OPEN · NOT YET
                      RUN, Operating-model illustration) or start with
                      "HYPOTHETICAL ·"
    organization-first narration must not carry lesson-40 audit items:
                      commit hashes, PR/test/commit counts, file paths,
                      "we are leading / mature / unusually active"
    banned-word       promo vocabulary (seamless, revolutionary,
                      game-changing, best-in-class, world-class,
                      cutting-edge, effortless, magical, blazing)
    cue-length        every cue is 3-6 words (lesson 16)
    cue-match         every cue occurs EXACTLY ONCE in its own scene's
                      narration (tags stripped before matching)
    points            at most --max-points (default 3) points per scene,
                      each at most --max-point-chars (default 34) chars
    title-length      scene title ≤45 chars

  --dispositions mode: the file must contain a markdown table with the
  header | Finding | Resolution | Evidence |, every data row must have
  three non-empty cells, and every Finding cell must name a scene (S\\d+).

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_screenplay_lint.py
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

LINT = Path(__file__).resolve().parent.parent.parent / "scripts" / "screenplay_lint.py"


def run_lint(*args, **kw):
    proc = subprocess.run(
        [sys.executable, str(LINT), *args], capture_output=True, text=True, timeout=30, **kw
    )
    return proc.returncode, proc.stdout, proc.stderr


def write(tmp_path, text, name="SCREENPLAY.md"):
    f = tmp_path / name
    f.write_text(text)
    return str(f)


CLEAN = """# Spin screenplay

## S01. The Question We Keep Hearing
Labels: WORKING PROTOTYPE
Points:
- One platform, not two
- Same control plane
Narration:
> Are we building a second platform? [src:owner-memo-01]
> The answer is no, and here is the proof. [CHECK]
Cues:
- building a second platform
- here is the proof

## S02. The Existing Code Changes The Answer
Narration:
> The team starts from the running system. [src:owner-memo-02]
Cues:
- starts from the running system
"""


# ---------------------------------------------------------------- basics


def test_clean_screenplay_passes(tmp_path):
    code, out, _ = run_lint(write(tmp_path, CLEAN))
    assert code == 0
    assert "OK" in out


def test_unreadable_file_exits_2(tmp_path):
    code, _, _ = run_lint(str(tmp_path / "nope.md"))
    assert code == 2


def test_json_output(tmp_path):
    bad = CLEAN.replace(" [src:owner-memo-02]", "")
    code, out, _ = run_lint(write(tmp_path, bad), "--json")
    assert code == 1
    findings = json.loads(out)
    assert findings and findings[0]["rule"] == "claims-untagged"
    assert findings[0]["scene"] == "S02"


def test_zero_scenes_is_a_finding_not_a_pass(tmp_path):
    # live 2026-10-04: the untouched pack template parsed as ZERO scenes and
    # the lint printed OK — a vacuous pass. No scenes = exit 1, named rule.
    for text in (
        "# A storyboard in a different format\n\n### 01. Title\n**Right panel:** a / b / c\n> narration line\n",
        "just prose, no scenes at all\n",
    ):
        f = tmp_path / "none.md"
        f.write_text(text)
        code, out, _ = run_lint(str(f))
        assert code == 1, text
        assert "no-scenes" in out


# ---------------------------------------------------------------- claims


def test_untagged_narration_line_fails(tmp_path):
    bad = CLEAN.replace(" [src:owner-memo-02]", "")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "claims-untagged" in out and "S02" in out


def test_check_tag_is_accepted(tmp_path):
    code, _, _ = run_lint(write(tmp_path, CLEAN))
    assert code == 0  # S01 line 2 is [CHECK]


# ---------------------------------------------------------------- labels


def test_unknown_label_fails(tmp_path):
    bad = CLEAN.replace("Labels: WORKING PROTOTYPE", "Labels: IN PRODUCTION")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "label-taxonomy" in out and "IN PRODUCTION" in out


def test_hypothetical_prefix_allowed(tmp_path):
    ok = CLEAN.replace(
        "Labels: WORKING PROTOTYPE",
        "Labels: HYPOTHETICAL · WHAT IF THE AUDIT FAILS, MERGED IN THE TWIN",
    )
    code, _, _ = run_lint(write(tmp_path, ok))
    assert code == 0


# ---------------------------------------------------------------- lesson 40


@pytest.mark.parametrize(
    "line",
    [
        "> The repo shows 412 commits this quarter. [src:x]",
        "> We merged 37 PRs in one sprint. [src:x]",
        "> All 215 tests pass. [src:x]",
        "> See src/api/handlers.py for the change. [src:x]",
        "> Commit 8cb0f5f2 landed the fix. [src:x]",
        "> We are leading the industry here. [src:x]",
    ],
)
def test_lesson_40_ban_list(tmp_path, line):
    bad = CLEAN + f"\n## S03. A Scene\nNarration:\n{line}\n"
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1, line
    assert "organization-first" in out, line


def test_banned_promo_words(tmp_path):
    bad = CLEAN + "\n## S03. A Scene\nNarration:\n> The flow is seamless and game-changing. [src:x]\n"
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "banned-word" in out and "seamless" in out


# ---------------------------------------------------------------- cues


def test_cue_too_short_or_long(tmp_path):
    bad = CLEAN.replace("- here is the proof", "- proof")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "cue-length" in out
    bad = CLEAN.replace("- here is the proof", "- the answer is no and here is the proof")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "cue-length" in out
    # design says 3-6 words (lesson 16), not 3-7 — a 7-word cue fails
    bad = CLEAN.replace("- here is the proof", "- answer is no and here is proof")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "cue-length" in out


def test_cue_must_occur_exactly_once(tmp_path):
    missing = CLEAN.replace("- here is the proof", "- phrase nobody ever says")
    code, out, _ = run_lint(write(tmp_path, missing))
    assert code == 1
    assert "cue-match" in out and "phrase nobody ever says" in out

    twice = CLEAN.replace(
        "> The answer is no, and here is the proof. [CHECK]",
        "> The answer is no, and here is the proof. [CHECK]\n> Again, here is the proof. [CHECK]",
    )
    code, out, _ = run_lint(write(tmp_path, twice))
    assert code == 1
    assert "cue-match" in out


def test_cue_matching_ignores_tags(tmp_path):
    # the [src:...] tag must be stripped before cue matching
    ok = CLEAN.replace("- starts from the running system", "- from the running system")
    code, _, _ = run_lint(write(tmp_path, ok))
    assert code == 0


# ---------------------------------------------------------------- points


def test_too_many_points(tmp_path):
    bad = CLEAN.replace(
        "- Same control plane",
        "- Same control plane\n- A third point here\n- A fourth point too",
    )
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "points" in out


def test_point_too_long_default_34(tmp_path):
    bad = CLEAN.replace("- Same control plane", "- " + "x" * 40)
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "points" in out


def test_point_limits_adjustable(tmp_path):
    text = CLEAN.replace("- Same control plane", "- " + "x" * 40)
    code, _, _ = run_lint(write(tmp_path, text), "--max-point-chars", "45")
    assert code == 0


# ---------------------------------------------------------------- titles


def test_title_too_long(tmp_path):
    bad = CLEAN.replace(
        "## S02. The Existing Code Changes The Answer",
        "## S02. " + "A Very Long Title That Keeps Going And Going Beyond Limits",
    )
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "title-length" in out


def test_slot_field_validated_when_present(tmp_path):
    ok = CLEAN.replace("## S01. The Question We Keep Hearing",
                       "## S01. The Question We Keep Hearing\nSlot: 00:00-00:45")
    code, _, _ = run_lint(write(tmp_path, ok))
    assert code == 0
    bad = CLEAN.replace("## S01. The Question We Keep Hearing",
                        "## S01. The Question We Keep Hearing\nSlot: zero to firty")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "slot-format" in out


def test_theme_and_status_fields(tmp_path):
    # act boundaries and scene status are EDITORIAL decisions made in the
    # screenplay, not constants (reference-reel DARK_SCENES removed)
    ok = CLEAN.replace("## S01. The Question We Keep Hearing",
                       "## S01. The Question We Keep Hearing\nTheme: dark\nStatus: PROPOSED RETURN HANDOFF")
    code, _, _ = run_lint(write(tmp_path, ok))
    assert code == 0
    bad = CLEAN.replace("## S01. The Question We Keep Hearing",
                        "## S01. The Question We Keep Hearing\nTheme: moody")
    code, out, _ = run_lint(write(tmp_path, bad))
    assert code == 1
    assert "theme-value" in out


def test_cues_per_point_flag(tmp_path):
    # footage pairs each right-panel point with exactly one cue, in order
    code, out, _ = run_lint(write(tmp_path, CLEAN), "--cues-per-point")
    assert code == 1  # S01 has 2 points but 2 cues... S02 has 0 points, 1 cue
    assert "cues-per-point" in out
    paired = CLEAN.replace(
        "Cues:\n- building a second platform\n- here is the proof",
        "Cues:\n- building a second platform\n- here is the proof",
    ).replace(
        "## S02. The Existing Code Changes The Answer\nNarration:",
        "## S02. The Existing Code Changes The Answer\nPoints:\n- Starts from the system\nNarration:",
    )
    code, _, _ = run_lint(write(tmp_path, paired), "--cues-per-point")
    assert code == 0


# ---------------------------------------------------------------- dispositions


def test_dispositions_valid(tmp_path):
    good = (
        "| Finding | Resolution | Evidence |\n"
        "|---|---|---|\n"
        "| S03: '412 commits' has no source | reworded per owner | owner note 10-04 |\n"
    )
    code, _, _ = run_lint("--dispositions", write(tmp_path, good, "disp.md"))
    assert code == 0


def test_dispositions_missing_header(tmp_path):
    bad = "| A | B |\n|---|---|\n| x | y |\n"
    code, out, _ = run_lint("--dispositions", write(tmp_path, bad, "disp.md"))
    assert code == 1
    assert "Finding" in out


def test_dispositions_row_without_scene_ref(tmp_path):
    bad = (
        "| Finding | Resolution | Evidence |\n"
        "|---|---|---|\n"
        "| vague worry with no scene | fixed | trust me |\n"
    )
    code, out, _ = run_lint("--dispositions", write(tmp_path, bad, "disp.md"))
    assert code == 1
    assert "scene" in out.lower()
