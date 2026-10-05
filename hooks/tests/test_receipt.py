#!/usr/bin/env python3
"""RED suite for the preservation-receipt tool (build step 4, 2026-10-04).

Script under test (does not exist yet):
  ~/.claude/plugins/cmo-plugin/scripts/receipt.py

/cmo:brief uses it to freeze the owner's inputs; the H5 hook and the
explainer's checkPreserved() verify the same {id, path, sha256} entries.

Contract (this file IS the spec for GREEN):

  receipt.py add --reel R --id ID --path P
      appends one {id, path, sha256} entry to the reel's receipt
      (production/reports/source-receipt.json, else production/out/...).
      Paths inside the reel are stored reel-relative; outside, absolute.
      Requires the receipt file to exist (/cmo:new writes it) -> exit 1
      pointing at /cmo:new otherwise. Re-registering an existing id ->
      exit 1 saying rebaseline is an explicit owner action. Missing input
      file -> exit 1.

  receipt.py verify --reel R
      exit 0 when every entry's sha256 matches disk (prints OK + count);
      exit 1 listing each drifted/missing path; exit 1 if no receipt.

  receipt.py rebaseline --reel R --reason "..."
      re-hashes every entry and appends {at, reason} to a "rebaselines"
      list in the receipt. Empty/missing reason -> exit 1 (the reason IS
      the owner action). A registered file now missing -> exit 1, nothing
      written.

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q test_receipt.py
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

TOOL = Path(__file__).resolve().parent.parent.parent / "scripts" / "receipt.py"


def run(*args, **kw):
    proc = subprocess.run([sys.executable, str(TOOL), *args],
                          capture_output=True, text=True, timeout=30, **kw)
    return proc.returncode, proc.stdout + proc.stderr


@pytest.fixture
def reel(tmp_path):
    root = tmp_path / "reel"
    reports = root / "production" / "reports"
    reports.mkdir(parents=True)
    (root / "CMO.md").write_text("#\n")
    (reports / "source-receipt.json").write_text(json.dumps(
        {"reel": "t", "form": "diagram", "pack": "diagram", "files": []}))
    return root


def receipt_of(reel):
    return json.loads((reel / "production" / "reports" / "source-receipt.json").read_text())


def test_add_registers_and_hashes(reel):
    memo = reel / "memo.md"
    memo.write_text("the owner's words\n")
    code, out = run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    assert code == 0
    data = receipt_of(reel)
    assert data["files"][0]["id"] == "memo"
    assert data["files"][0]["path"] == "memo.md"  # reel-relative
    assert len(data["files"][0]["sha256"]) == 64
    assert data["form"] == "diagram"  # existing keys preserved


def test_add_outside_reel_stores_absolute(reel, tmp_path):
    ext = tmp_path / "outside.m4a"
    ext.write_bytes(b"audio")
    code, _ = run("add", "--reel", str(reel), "--id", "memo-audio", "--path", str(ext))
    assert code == 0
    assert receipt_of(reel)["files"][0]["path"] == str(ext)


def test_add_duplicate_id_refused(reel):
    memo = reel / "memo.md"
    memo.write_text("v1\n")
    run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    code, out = run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    assert code == 1
    assert "rebaseline" in out.lower()


def test_add_without_receipt_points_at_cmo_new(reel):
    (reel / "production" / "reports" / "source-receipt.json").unlink()
    memo = reel / "memo.md"
    memo.write_text("x\n")
    code, out = run("add", "--reel", str(reel), "--id", "m", "--path", str(memo))
    assert code == 1
    assert "cmo:new" in out


def test_add_missing_input_file(reel):
    code, _ = run("add", "--reel", str(reel), "--id", "m", "--path", str(reel / "nope.md"))
    assert code == 1


def test_verify_ok_and_drift(reel):
    memo = reel / "memo.md"
    memo.write_text("frozen\n")
    run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    code, out = run("verify", "--reel", str(reel))
    assert code == 0 and "OK" in out
    memo.write_text("tampered\n")
    code, out = run("verify", "--reel", str(reel))
    assert code == 1 and "memo.md" in out


def test_verify_no_receipt(reel):
    (reel / "production" / "reports" / "source-receipt.json").unlink()
    code, _ = run("verify", "--reel", str(reel))
    assert code == 1


def test_rebaseline_requires_reason(reel):
    memo = reel / "memo.md"
    memo.write_text("v1\n")
    run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    memo.write_text("v2\n")
    code, out = run("rebaseline", "--reel", str(reel), "--reason", "")
    assert code == 1
    code, _ = run("rebaseline", "--reel", str(reel), "--reason", "owner replaced the memo 2026-10-04")
    assert code == 0
    data = receipt_of(reel)
    assert data["rebaselines"][0]["reason"].startswith("owner replaced")
    code, _ = run("verify", "--reel", str(reel))
    assert code == 0  # hashes now match v2


def test_rebaseline_refuses_missing_file(reel):
    memo = reel / "memo.md"
    memo.write_text("v1\n")
    run("add", "--reel", str(reel), "--id", "memo", "--path", str(memo))
    memo.unlink()
    code, out = run("rebaseline", "--reel", str(reel), "--reason", "why")
    assert code == 1 and "memo.md" in out


def test_explainer_out_location(tmp_path):
    root = tmp_path / "exp"
    out_dir = root / "production" / "out"
    out_dir.mkdir(parents=True)
    (root / "CMO.md").write_text("#\n")
    (out_dir / "source-receipt.json").write_text(json.dumps({"form": "explainer", "files": []}))
    src = root / "SCRIPT.md"
    src.write_text("## 1. t\n")
    code, _ = run("add", "--reel", str(root), "--id", "script", "--path", str(src))
    assert code == 0
    data = json.loads((out_dir / "source-receipt.json").read_text())
    assert data["files"][0]["id"] == "script"
