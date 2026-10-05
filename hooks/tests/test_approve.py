#!/usr/bin/env python3
"""RED suite for the approval-marker writer (build step 4, 2026-10-04).

Script under test (does not exist yet):
  ~/.claude/plugins/cmo-plugin/scripts/approve.py

/cmo:review is the ONLY writer of reports/APPROVED-<fingerprint> — the
marker the H4 hook demands before any render/finish. This tool is that
writer.

Contract (this file IS the spec for GREEN):

  approve.py --reel R [--by NAME]
      reads production/reports/check.json; requires ok === true ->
      writes reports/APPROVED-<fingerprint> as JSON
      {fingerprint, approvedAt, by, skip: false}; prints the marker path.
      Missing check.json -> exit 1 ("run the checks"); ok false -> exit 1;
      no fingerprint in check.json -> exit 1.

  approve.py --reel R --skip --quote "..." [--by NAME]
      the lesson-48 owner-authority skip: STILL requires a green
      check.json (quality floor is not skippable; the approval STOP is),
      writes the marker with skip: true and the owner's words verbatim.
      Empty/missing --quote -> exit 1 (a skip is never inferred).

  Integration: a marker written by approve.py must satisfy the H4 hook —
  cmo_guard.py allows `npm run render:base` afterwards.

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_approve.py
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

TOOL = Path(__file__).resolve().parent.parent.parent / "scripts" / "approve.py"
HOOK = Path(__file__).resolve().parent.parent / "cmo_guard.py"


def run(*args):
    proc = subprocess.run([sys.executable, str(TOOL), *args],
                          capture_output=True, text=True, timeout=30)
    return proc.returncode, proc.stdout + proc.stderr


@pytest.fixture
def reel(tmp_path):
    root = tmp_path / "reel"
    reports = root / "production" / "reports"
    reports.mkdir(parents=True)
    (root / "CMO.md").write_text("#\n")
    (root / "production" / "hyperframes.json").write_text("{}")
    (root / "production" / "scenes.mjs").write_text("export const SCENES=[]\n")
    (reports / "check.json").write_text(json.dumps({"ok": True, "fingerprint": "f1f2f3"}))
    return root


def marker(reel, fp="f1f2f3"):
    return reel / "production" / "reports" / f"APPROVED-{fp}"


def test_approve_writes_marker(reel):
    code, out = run("--reel", str(reel), "--by", "Suresh")
    assert code == 0
    assert str(marker(reel)) in out
    data = json.loads(marker(reel).read_text())
    assert data["fingerprint"] == "f1f2f3"
    assert data["by"] == "Suresh"
    assert data["skip"] is False
    assert data["approvedAt"]


def test_approve_requires_check(reel):
    (reel / "production" / "reports" / "check.json").unlink()
    code, out = run("--reel", str(reel))
    assert code == 1
    assert "check" in out.lower()
    assert not list((reel / "production" / "reports").glob("APPROVED-*"))


def test_approve_requires_green_check(reel):
    (reel / "production" / "reports" / "check.json").write_text(
        json.dumps({"ok": False, "fingerprint": "f1f2f3"}))
    code, _ = run("--reel", str(reel))
    assert code == 1
    assert not marker(reel).exists()


def test_approve_requires_fingerprint(reel):
    (reel / "production" / "reports" / "check.json").write_text(json.dumps({"ok": True}))
    code, _ = run("--reel", str(reel))
    assert code == 1


def test_skip_requires_quote(reel):
    code, out = run("--reel", str(reel), "--skip")
    assert code == 1
    assert "quote" in out.lower()
    code, out = run("--reel", str(reel), "--skip", "--quote", "")
    assert code == 1


def test_skip_records_quote_verbatim(reel):
    quote = "finish without further approval stops"
    code, _ = run("--reel", str(reel), "--skip", "--quote", quote, "--by", "owner")
    assert code == 0
    data = json.loads(marker(reel).read_text())
    assert data["skip"] is True
    assert data["quote"] == quote


def test_skip_still_requires_green_check(reel):
    (reel / "production" / "reports" / "check.json").write_text(
        json.dumps({"ok": False, "fingerprint": "f1f2f3"}))
    code, _ = run("--reel", str(reel), "--skip", "--quote", "just ship it")
    assert code == 1
    assert not marker(reel).exists()


def test_approve_requires_by(reel):
    # review MUST 5b: an approval without a name is not an approval
    code, out = run("--reel", str(reel))
    assert code == 1
    assert "--by" in out or "name" in out.lower()
    assert not marker(reel).exists()
    code, _ = run("--reel", str(reel), "--skip", "--quote", "finish without stops")
    assert code == 1


def test_approve_explainer_verification_report(tmp_path):
    # review MUST 3: explainer reels approve against out/verification-report.json
    root = tmp_path / "exp"
    out_dir = root / "production" / "out"
    out_dir.mkdir(parents=True)
    (root / "CMO.md").write_text("#\n")
    (root / "production" / "story.mjs").write_text("export const SCENES=[]\n")
    (root / "production" / "production.mjs").write_text("export function checkPreserved(){}\n")
    (out_dir / "verification-report.json").write_text(json.dumps(
        {"technicalPass": True, "version": "story-cut-1", "sha256": "ab12" * 16}))
    code, out = run("--reel", str(root), "--by", "Suresh")
    assert code == 0, out
    markers = list((root / "production" / "reports").glob("APPROVED-*"))
    assert len(markers) == 1
    data = json.loads(markers[0].read_text())
    assert data["by"] == "Suresh" and data["skip"] is False
    # a failed verification refuses
    (out_dir / "verification-report.json").write_text(json.dumps(
        {"technicalPass": False, "version": "story-cut-1", "sha256": "cd34" * 16}))
    code, _ = run("--reel", str(root), "--by", "Suresh")
    assert code == 1


def test_marker_satisfies_h4_hook(reel):
    payload = json.dumps({"tool_name": "Bash",
                          "tool_input": {"command": "npm run render:base -- --approved"},
                          "cwd": str(reel / "production")})
    denied = subprocess.run([sys.executable, str(HOOK)], input=payload,
                            capture_output=True, text=True, timeout=30)
    assert denied.returncode == 2  # no marker yet
    code, _ = run("--reel", str(reel), "--by", "Suresh")
    assert code == 0
    allowed = subprocess.run([sys.executable, str(HOOK)], input=payload,
                             capture_output=True, text=True, timeout=30)
    assert allowed.returncode == 0  # marker satisfies H4
