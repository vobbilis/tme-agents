#!/usr/bin/env python3
"""RED suite for the cmo-plugin production hooks (build step 2, 2026-10-04).

One script under test. It does not exist yet — every test here must FAIL
until GREEN builds it:

  ~/.claude/plugins/cmo-plugin/hooks/cmo_guard.py   PreToolUse guard, H1-H6

Contract pinned by these tests (this file IS the spec for GREEN):

  - reads one PreToolUse JSON payload on stdin; exit 0 = allow, exit 2 =
    deny with plain-English guidance on stderr prefixed "CMO-GUARD:"
  - fail-open on garbage stdin and no payload. H3-H6 arm only inside a
    reel project; detection walks the ancestry of the Bash cwd (or the
    edited file) for a dir holding CMO.md, or hyperframes.json +
    scenes.mjs, or story.mjs + production.mjs — AND, for Bash, of any
    `cd` target or path argument in the command, so a `cd X && ...`
    prefix cannot step around the project-scoped guards (bypass found
    live 2026-10-04 by the dry-run session)
  - H1 and H2 are GLOBAL: publish/cloud sends, media/font uploads, and
    telemetry-less hyperframes invocations are denied wherever the plugin
    is loaded — they do not depend on project detection at all
  - every deny also appends one JSON line to <production>/reports/hooks.log
    (never a cwd-relative logs/); logging failure never blocks
  - H1 media/fonts never leave the machine: deny `hyperframes publish`,
    `--cloud` render flags, and curl/scp/rsync/gh release upload/aws s3 cp
    whose ARGUMENTS contain .mov/.mp4/.webm/.m4a/.otf. Local rsync of
    directories (no media extension in args) stays allowed
  - H2 telemetry: a hyperframes INVOCATION (npx hyperframes …,
    …/node_modules/.bin/hyperframes …) must carry HYPERFRAMES_NO_TELEMETRY=1
    in the command text. Mentions of hyperframes in paths/filenames
    (hyperframes.json, demo/hyperframes-reel-kit/) are not invocations
  - H3 generated files: when the project has a scenes.mjs, deny Edit/Write/
    NotebookEdit to the GENERATED set beside it: STORYBOARD.md, SCRIPT.md,
    index.html, compositions/*.html, *.motion.json, reports/**. The sources
    (scenes.mjs itself, reel-root STORYBOARD_REVIEW.md, explainer SCRIPT.md
    in a project with no scenes.mjs) stay editable
  - H4 render gate: deny npm run render* / npm run finish / node render.mjs
    / node finish.mjs unless reports/check.json exists, says ok:true, and
    reports/APPROVED-<its fingerprint> exists (written by /cmo:review)
  - H5 receipt drift: before production steps (npm run narrate|build|check|
    test|snapshot|animation-map|render*|finish, node <those>.mjs), every
    {path, sha256} entry in the production receipt
    (reports/source-receipt.json or out/source-receipt.json) must still
    match the file on disk; a drifted entry denies and says rebaselining is
    an explicit owner action. Missing receipt or empty files[] = pre-brief
    scaffold -> allow. npm ci / npm run doctor are never gated by H5
  - H6 git: deny `git add` of media (.mov/.mp4/.webm/.m4a) or of `.` /-A
    when the reel root has no .gitignore covering media; deny `git commit`
    when media is already staged; deny `git add` of .otf when any remote
    host is not internal (hpe.com / hpecorp.net)

Run:  cd ~/.claude/plugins/cmo-plugin/hooks/tests && \
      uv run --with pytest python3 -m pytest -q
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

HOOK = Path(__file__).resolve().parent.parent / "cmo_guard.py"


# ---------------------------------------------------------------- helpers


def run_hook(payload, cwd=None):
    """Feed one payload to the hook; return (exit_code, stderr)."""
    proc = subprocess.run(
        [sys.executable, str(HOOK)],
        input=payload if isinstance(payload, str) else json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=cwd or os.getcwd(),
        timeout=30,
    )
    return proc.returncode, proc.stderr


def bash(command, cwd):
    return {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": str(cwd)}


def edit(file_path, cwd):
    return {
        "tool_name": "Edit",
        "tool_input": {"file_path": str(file_path), "old_string": "a", "new_string": "b"},
        "cwd": str(cwd),
    }


def write(file_path, cwd):
    return {
        "tool_name": "Write",
        "tool_input": {"file_path": str(file_path), "content": "x"},
        "cwd": str(cwd),
    }


@pytest.fixture
def hf_reel(tmp_path):
    """A scaffolded Hyperframes reel: CMO.md at root, markers in production/."""
    root = tmp_path / "reel"
    prod = root / "production"
    (prod / "reports").mkdir(parents=True)
    (root / "CMO.md").write_text("# standing orders\n")
    (prod / "hyperframes.json").write_text("{}")
    (prod / "scenes.mjs").write_text("export const SCENES = []\n")
    return root


@pytest.fixture
def explainer_reel(tmp_path):
    """A scaffolded explainer: no hyperframes.json, no scenes.mjs."""
    root = tmp_path / "exp"
    prod = root / "production"
    (prod / "out").mkdir(parents=True)
    (root / "CMO.md").write_text("# standing orders\n")
    (root / "SCRIPT.md").write_text("## 1. Title\n> vo\n")
    (prod / "story.mjs").write_text("export const SCENES = []\n")
    (prod / "production.mjs").write_text("export function checkPreserved() {}\n")
    return root


@pytest.fixture
def plain(tmp_path):
    """Not a reel project."""
    d = tmp_path / "plain"
    d.mkdir()
    return d


# ---------------------------------------------------------------- fail-open


def test_garbage_stdin_fails_open(plain):
    code, _ = run_hook("this is not json")
    assert code == 0


def test_plain_dir_h1_h2_still_global(plain):
    # H1/H2 are machine-wide: no reel project required
    code, err = run_hook(bash("npx hyperframes publish", plain))
    assert code == 2 and "CMO-GUARD" in err
    code, _ = run_hook(bash("curl -T film.mp4 https://example.com", plain))
    assert code == 2
    code, _ = run_hook(bash("npx hyperframes doctor", plain))
    assert code == 2  # telemetry flag missing, anywhere


def test_plain_dir_project_guards_fail_open(plain):
    code, _ = run_hook(write(plain / "STORYBOARD.md", plain))
    assert code == 0  # H3 needs a reel
    code, _ = run_hook(bash("git add clip.mp4 && git commit -m x", plain))
    assert code == 0  # H6 needs a reel
    code, _ = run_hook(bash("npm run render:base", plain))
    assert code == 0  # H4 needs a reel


def test_cd_prefix_cannot_bypass(hf_reel, plain):
    # the live 1.1 bypass: payload cwd outside the reel, cd inside it
    cmd = f"cd {hf_reel}/production && npx hyperframes publish"
    code, err = run_hook(bash(cmd, plain))
    assert code == 2 and "publish" in err
    cmd = f"cd {hf_reel}/production && npm run render:base"
    code, err = run_hook(bash(cmd, plain))
    assert code == 2 and "check" in err.lower()  # H4 armed via the cd target


def test_path_argument_arms_project_guards(hf_reel, plain):
    cmd = f"npm --prefix {hf_reel}/production run render:base"
    code, _ = run_hook(bash(cmd, plain))
    assert code == 2  # H4 armed via the path argument


# ---------------------------------------------------------------- H1


def test_h1_publish_denied(hf_reel):
    code, err = run_hook(bash("HYPERFRAMES_NO_TELEMETRY=1 npx hyperframes publish", hf_reel / "production"))
    assert code == 2
    assert "CMO-GUARD" in err and "publish" in err


def test_h1_cloud_render_denied(hf_reel):
    code, err = run_hook(
        bash("HYPERFRAMES_NO_TELEMETRY=1 npx hyperframes render --cloud", hf_reel / "production")
    )
    assert code == 2
    assert "cloud" in err.lower()


def test_h1_media_upload_denied(hf_reel):
    for cmd in (
        "curl -T out/film.mp4 https://example.com/up",
        "scp production/assets/fonts/HPEGraphik-Bold.otf host:/tmp/",
        "aws s3 cp renders/base.mov s3://bucket/",
        "gh release upload v1 out/film.webm",
        "rsync -a assets/audio/take.m4a host:/in/",
    ):
        code, err = run_hook(bash(cmd, hf_reel))
        assert code == 2, cmd
        assert "never leave" in err or "machine" in err, cmd


def test_h1_local_rsync_of_dirs_allowed(hf_reel):
    code, _ = run_hook(bash("rsync -a ./ /tmp/spin-copy/", hf_reel / "production"))
    assert code == 0


# ---------------------------------------------------------------- H2


def test_h2_hyperframes_without_no_telemetry_denied(hf_reel):
    code, err = run_hook(bash("npx hyperframes preview --port 3017", hf_reel / "production"))
    assert code == 2
    assert "HYPERFRAMES_NO_TELEMETRY=1" in err


def test_h2_hyperframes_with_no_telemetry_allowed(hf_reel):
    code, _ = run_hook(
        bash("HYPERFRAMES_NO_TELEMETRY=1 npx hyperframes preview --port 3017", hf_reel / "production")
    )
    assert code == 0


def test_h2_path_mentions_are_not_invocations(hf_reel):
    for cmd in (
        "cat hyperframes.json",
        "ls demo/hyperframes-reel-kit/",
        "grep hyperframes package.json",
    ):
        code, _ = run_hook(bash(cmd, hf_reel / "production"))
        assert code == 0, cmd


def test_mentions_in_heredocs_and_echo_are_not_invocations(hf_reel, plain):
    # live false positive 2026-10-04: a heredoc APPENDING log text that
    # quoted the publish command was denied by global H1. Text about a
    # command is not the command.
    heredoc = (
        "cat >> SESSION_LOG.md <<'EOF'\n"
        "[11:16] 1.1 PASS: `cd ~/tmp/spin-diagram/production && npx hyperframes publish` denied\n"
        "curl -T out/film.mp4 https://example.com would also be denied\n"
        "EOF"
    )
    for cwd in (plain, hf_reel / "production"):
        code, err = run_hook(bash(heredoc, cwd))
        assert code == 0, (cwd, err)
    code, _ = run_hook(bash("echo 'npx hyperframes publish'", plain))
    assert code == 0


def test_real_publish_after_heredoc_still_denied(hf_reel):
    cmd = "cat >> notes.md <<'EOF'\nharmless text\nEOF\nnpx hyperframes publish"
    code, err = run_hook(bash(cmd, hf_reel / "production"))
    assert code == 2
    assert "publish" in err


def test_global_deny_logs_to_plugin_data(plain, tmp_path):
    # global denials outside a project must still leave an audit line
    import subprocess, sys, os as _os, json as _json
    data_dir = tmp_path / "plugin-data"
    env = dict(_os.environ, CLAUDE_PLUGIN_DATA=str(data_dir))
    payload = bash("npx hyperframes publish", plain)
    proc = subprocess.run([sys.executable, str(HOOK)], input=_json.dumps(payload),
                          capture_output=True, text=True, timeout=30, env=env)
    assert proc.returncode == 2
    log = data_dir / "hooks.log"
    assert log.exists()
    assert _json.loads(log.read_text().strip().splitlines()[-1])["hook"] == "H1"


def test_h2_bin_path_invocation_denied(hf_reel):
    code, err = run_hook(
        bash("./node_modules/.bin/hyperframes preview --stop", hf_reel / "production")
    )
    assert code == 2
    assert "HYPERFRAMES_NO_TELEMETRY=1" in err


def test_subshell_and_chained_cd_arms(hf_reel, tmp_path):
    # review MUST 2: subshell + chained relative cds, no slash in either
    cwd = hf_reel.parent  # 'reel' is a bare name from here
    code, err = run_hook(bash("(cd reel && cd production && npm run render:base)", cwd))
    assert code == 2 and "check" in err.lower()


def test_dir_flags_arm_project(hf_reel, tmp_path):
    cwd = hf_reel.parent
    for cmd in (
        "git -C reel/production status && npm --prefix reel/production run render:base",
        "pushd reel/production && npm run render:base",
    ):
        code, _ = run_hook(bash(cmd, cwd))
        assert code == 2, cmd


def test_interpreter_heredoc_is_analyzed(hf_reel, plain):
    # review MUST 2b: a heredoc fed to a SHELL is executable, not prose
    cmd = f"bash <<'EOF'\ncd {hf_reel}/production && npx hyperframes publish\nEOF"
    code, err = run_hook(bash(cmd, plain))
    assert code == 2 and "publish" in err
    # but a heredoc fed to cat stays prose (regression guard)
    cmd = "cat >> notes.md <<'EOF'\nnpx hyperframes publish\nEOF"
    code, _ = run_hook(bash(cmd, hf_reel / "production"))
    assert code == 0


def test_approval_marker_cannot_be_forged(hf_reel, explainer_reel):
    # review MUST 5: the marker is approve.py's alone
    for cmd in (
        f"cd {hf_reel}/production && touch reports/APPROVED-abc",
        f"echo '{{}}' > {hf_reel}/production/reports/APPROVED-abc",
        f"cp /tmp/x {hf_reel}/production/reports/APPROVED-abc",
    ):
        code, err = run_hook(bash(cmd, hf_reel))
        assert code == 2, cmd
        assert "cmo:review" in err or "approve" in err.lower()
    # Write tool, including in an explainer reel where H3 is inactive
    code, _ = run_hook(write(explainer_reel / "production" / "reports" / "APPROVED-abc", explainer_reel))
    assert code == 2
    # approve.py itself stays allowed
    code, _ = run_hook(bash(f"python3 ~/.claude/plugins/cmo-plugin/scripts/approve.py --reel {hf_reel} --by Suresh", hf_reel))
    assert code == 0


def test_h1_covers_piped_media_dirs(hf_reel):
    # review MUST 6: tar|ssh of the footage dirs
    code, err = run_hook(bash("tar cz assets/footage | ssh host 'cat > dump.tgz'", hf_reel / "production"))
    assert code == 2
    code, _ = run_hook(bash("ssh host ls /tmp", hf_reel / "production"))
    assert code == 0


def test_h6_font_directory_add_denied(hf_reel):
    _git(hf_reel, "init", "-q")
    _git(hf_reel, "remote", "add", "origin", "https://github.com/example/public.git")
    code, err = run_hook(bash("git add production/assets/fonts/", hf_reel))
    assert code == 2
    assert "font" in err.lower() or "licen" in err.lower()


def test_h4_explainer_render_not_blocked_on_missing_check(explainer_reel):
    # review MUST 3: the explainer pipeline never writes reports/check.json;
    # its own code gates (checkPreserved, duration guards) do the work
    code, _ = run_hook(bash(f"cd {explainer_reel}/production && node finish.mjs", explainer_reel))
    assert code == 0


# ---------------------------------------------------------------- H3


def test_h3_generated_files_denied(hf_reel):
    prod = hf_reel / "production"
    for target in (
        prod / "STORYBOARD.md",
        prod / "index.html",
        prod / "compositions" / "scene-01.html",
        prod / "scene-01.motion.json",
        prod / "reports" / "timeline.json",
    ):
        code, err = run_hook(edit(target, hf_reel))
        assert code == 2, target
        assert "generated" in err.lower(), target
        assert "scenes.mjs" in err, target


def test_h3_sources_stay_editable(hf_reel):
    for target in (
        hf_reel / "production" / "scenes.mjs",
        hf_reel / "STORYBOARD_REVIEW.md",
        hf_reel / "BRIEF.md",
        hf_reel / "production" / "scripts" / "lib" / "shots.mjs",
    ):
        code, _ = run_hook(edit(target, hf_reel))
        assert code == 0, target


def test_h3_inactive_without_scenes_mjs(explainer_reel):
    # explainer SCRIPT.md is the SOURCE; no scenes.mjs -> H3 must not fire
    code, _ = run_hook(edit(explainer_reel / "SCRIPT.md", explainer_reel))
    assert code == 0


# ---------------------------------------------------------------- H4


def test_h4_render_without_check_denied(hf_reel):
    code, err = run_hook(bash("npm run render:base -- --approved", hf_reel / "production"))
    assert code == 2
    assert "check" in err.lower()


def test_h4_render_with_failed_check_denied(hf_reel):
    reports = hf_reel / "production" / "reports"
    (reports / "check.json").write_text(json.dumps({"ok": False, "fingerprint": "abc"}))
    code, _ = run_hook(bash("npm run render:base", hf_reel / "production"))
    assert code == 2


def test_h4_render_without_approval_marker_denied(hf_reel):
    reports = hf_reel / "production" / "reports"
    (reports / "check.json").write_text(json.dumps({"ok": True, "fingerprint": "abc"}))
    code, err = run_hook(bash("npm run render:base", hf_reel / "production"))
    assert code == 2
    assert "cmo:review" in err or "APPROVED" in err


def test_h4_render_with_approval_allowed(hf_reel):
    reports = hf_reel / "production" / "reports"
    (reports / "check.json").write_text(json.dumps({"ok": True, "fingerprint": "abc"}))
    (reports / "APPROVED-abc").write_text("{}")
    code, _ = run_hook(bash("npm run render:base -- --approved", hf_reel / "production"))
    assert code == 0


def test_h4_review_draft_render_needs_only_green_check(hf_reel):
    # review round 4: Studio-no-audio fallback must not deadlock on the
    # approval marker — a review DRAFT renders with green checks alone
    reports = hf_reel / "production" / "reports"
    code, err = run_hook(bash("npm run render:review", hf_reel / "production"))
    assert code == 2  # quality floor holds: no check.json, no draft
    (reports / "check.json").write_text(json.dumps({"ok": True, "fingerprint": "abc"}))
    code, _ = run_hook(bash("npm run render:review", hf_reel / "production"))
    assert code == 0  # green check, NO marker — draft allowed
    code, _ = run_hook(bash("node scripts/render.mjs --review-draft", hf_reel / "production"))
    assert code == 0
    # the real render still demands the marker
    code, err = run_hook(bash("npm run render:base -- --approved", hf_reel / "production"))
    assert code == 2 and ("APPROVED" in err or "cmo:review" in err)


def test_h4_finish_gated_too(hf_reel):
    code, _ = run_hook(bash("node scripts/finish.mjs", hf_reel / "production"))
    assert code == 2


# ---------------------------------------------------------------- H5


def _receipt(hf_reel, files):
    reports = hf_reel / "production" / "reports"
    (reports / "source-receipt.json").write_text(
        json.dumps({"reel": "t", "form": "diagram", "files": files})
    )


def test_h5_drifted_receipt_denies_production_step(hf_reel):
    src = hf_reel / "memo.md"
    src.write_text("original owner input\n")
    _receipt(hf_reel, [{"id": "memo", "path": str(src), "sha256": "0" * 64}])
    code, err = run_hook(bash("npm run build", hf_reel / "production"))
    assert code == 2
    assert "memo.md" in err
    assert "rebaseline" in err.lower() or "owner" in err.lower()


def test_h5_matching_receipt_allows(hf_reel):
    import hashlib

    src = hf_reel / "memo.md"
    src.write_text("original owner input\n")
    sha = hashlib.sha256(src.read_bytes()).hexdigest()
    _receipt(hf_reel, [{"id": "memo", "path": str(src), "sha256": sha}])
    code, _ = run_hook(bash("npm run build", hf_reel / "production"))
    assert code == 0


def test_h5_missing_or_empty_receipt_allows(hf_reel):
    code, _ = run_hook(bash("npm run build", hf_reel / "production"))
    assert code == 0  # no receipt at all
    _receipt(hf_reel, [])
    code, _ = run_hook(bash("npm run build", hf_reel / "production"))
    assert code == 0  # pre-brief scaffold


def test_h5_never_gates_setup_steps(hf_reel):
    _receipt(hf_reel, [{"id": "gone", "path": str(hf_reel / "gone.md"), "sha256": "0" * 64}])
    for cmd in ("npm ci", "npm run doctor"):
        code, _ = run_hook(bash(cmd, hf_reel / "production"))
        assert code == 0, cmd


# ---------------------------------------------------------------- H6


def _git(reel, *args):
    subprocess.run(["git", *args], cwd=reel, capture_output=True, check=True)


def test_h6_git_add_media_denied(hf_reel):
    code, err = run_hook(bash("git add out/film.mp4", hf_reel))
    assert code == 2
    assert "media" in err.lower() or ".mp4" in err


def test_h6_git_add_dot_without_gitignore_denied(hf_reel):
    code, err = run_hook(bash("git add .", hf_reel))
    assert code == 2
    assert ".gitignore" in err


def test_h6_git_add_dot_with_gitignore_allowed(hf_reel):
    (hf_reel / ".gitignore").write_text("*.mov\n*.mp4\n*.webm\n*.m4a\n")
    code, _ = run_hook(bash("git add .", hf_reel))
    assert code == 0


def test_h6_commit_with_staged_media_denied(hf_reel):
    _git(hf_reel, "init", "-q")
    (hf_reel / "clip.mp4").write_bytes(b"\x00fake")
    _git(hf_reel, "add", "clip.mp4")
    code, err = run_hook(bash("git commit -m 'cut'", hf_reel))
    assert code == 2
    assert "clip.mp4" in err


def test_h6_commit_clean_allowed(hf_reel):
    _git(hf_reel, "init", "-q")
    (hf_reel / "notes.md").write_text("ok\n")
    _git(hf_reel, "add", "notes.md")
    code, _ = run_hook(bash("git commit -m 'notes'", hf_reel))
    assert code == 0


def test_h6_otf_to_external_remote_denied(hf_reel):
    _git(hf_reel, "init", "-q")
    _git(hf_reel, "remote", "add", "origin", "https://github.com/example/public.git")
    code, err = run_hook(bash("git add production/assets/fonts/HPEGraphik-Bold.otf", hf_reel))
    assert code == 2
    assert "font" in err.lower() or "licence" in err.lower() or "license" in err.lower()


def test_h6_otf_to_internal_remote_allowed(hf_reel):
    _git(hf_reel, "init", "-q")
    _git(hf_reel, "remote", "add", "origin", "git@github.hpe.com:org/internal.git")
    code, _ = run_hook(bash("git add production/assets/fonts/HPEGraphik-Bold.otf", hf_reel))
    assert code == 0


# ---------------------------------------------------------------- logging


def test_deny_appends_to_hooks_log(hf_reel):
    log = hf_reel / "production" / "reports" / "hooks.log"
    assert not log.exists()
    code, _ = run_hook(bash("npx hyperframes publish", hf_reel / "production"))
    assert code == 2
    assert log.exists()
    line = json.loads(log.read_text().strip().splitlines()[-1])
    assert line["hook"].startswith("H")
    assert "publish" in line["command"]


def test_log_never_written_relative_to_cwd(hf_reel, tmp_path, monkeypatch):
    # the known litter bug: hooks must not create ./logs or ./reports in cwd
    outside = tmp_path / "elsewhere"
    outside.mkdir()
    payload = bash("npx hyperframes publish", hf_reel / "production")
    proc = subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=outside,
        timeout=30,
    )
    assert proc.returncode == 2
    assert not (outside / "logs").exists()
    assert not (outside / "reports").exists()
