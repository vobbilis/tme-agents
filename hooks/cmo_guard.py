#!/usr/bin/env python3
"""PreToolUse hook: cmo-plugin production guard (H1-H6, build step 2).

H1 (nothing leaves the machine) and H2 (telemetry off) are GLOBAL — they
fire wherever the plugin is loaded, no project needed. H3-H6 arm inside a
reel project: a directory ancestry holding CMO.md, or hyperframes.json +
scenes.mjs, or story.mjs + production.mjs — searched from the payload cwd
AND from any `cd` target or path argument in the command, so a
`cd X && ...` prefix cannot step around them (live bypass, 2026-10-04).
On any internal error it fails open: daily sessions must never notice it.

What it enforces inside a reel project:
  H1  footage, memos and fonts never leave the machine (no hyperframes
      publish / cloud render; no curl/scp/rsync/gh release upload/aws s3 cp
      whose arguments carry media or font files)
  H2  every hyperframes invocation carries HYPERFRAMES_NO_TELEMETRY=1
  H3  generated files are not hand-edited when a scenes.mjs exists —
      the script is data, everything else regenerates
  H4  Hyperframes render/finish refuse without a green reports/check.json
      AND the owner's approval marker reports/APPROVED-<fingerprint>
      (/cmo:review). Explainer reels are exempt — that pipeline carries its
      own code gates (checkPreserved, duration guards) and never writes
      check.json. The marker itself is write-protected: only approve.py
      creates it (forging via touch/cp/redirect or Write is denied)
  H5  production steps refuse when the source receipt has drifted —
      rebaselining is an explicit owner action, never implicit
  H6  git never stages media; fonts (files OR the fonts directory) never
      go to a non-internal remote

  H1 is BEST-EFFORT by design: it checks known uploaders (curl, scp, rsync,
  aws s3 cp, gh release upload, ssh, sftp, rclone, nc) carrying media/font
  extensions or the media directories (assets/footage, assets/audio,
  renders/). A sufficiently creative pipe can evade it; the .gitignore,
  H6 and human review are the other layers.

Every deny prints plain-English guidance on stderr ("CMO-GUARD: ...") and
appends one JSON line to <production>/reports/hooks.log — resolved from the
payload, NEVER relative to the hook process cwd (the known litter bug).

Plain python3 + stdlib on purpose: this runs on every tool call and uv
startup latency is not acceptable (measured on the scope guardrails,
2026-09-27).

Contract pinned by hooks/tests/test_cmo_hooks.py.
Exit 0 = allow. Exit 2 = deny, guidance on stderr.
"""

import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import time

MEDIA_EXT = (".mov", ".mp4", ".webm", ".m4a")
FONT_EXT = (".otf",)
INTERNAL_HOST_SUFFIXES = ("hpe.com", "hpecorp.net")
UPLOADER_RE = re.compile(r"\b(curl|scp|rsync|aws\s+s3\s+cp|gh\s+release\s+upload|ssh|sftp|rclone|nc)\b")
MEDIA_DIRS = ("assets/footage", "assets/audio", "renders/", "renders")
RENDER_RE = re.compile(r"npm\b[^;&|]*\brun\s+(?:render(?::\S+)?|finish)\b|\b(?:render|render-closing|finish)\.mjs\b")
PRODUCTION_RE = re.compile(
    r"npm\b[^;&|]*\brun\s+(?:narrate|build|check|test|snapshot|animation-map|render(?::\S+)?"
    r"|finish|prepare-footage|prepare-focus|verify|media|production)\b"
    r"|\b(?:narrate|build|build-board|check|snapshot|verify|media|production|timing"
    r"|render|render-closing|finish|illustrations|closing-motion)\.mjs\b"
)
GENERATED_NAMES = {"STORYBOARD.md", "SCRIPT.md", "index.html"}
WRITE_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
WRAPPERS = {"env", "npx", "exec", "command", "nohup", "time"}


def allow():
    sys.exit(0)


def find_project(start):
    """Walk up from `start`; return (reel_root, production_dir) or (None, None)."""
    d = os.path.realpath(start or os.getcwd())
    while True:
        try:
            names = set(os.listdir(d))
        except OSError:
            names = set()
        hf = {"hyperframes.json", "scenes.mjs"} <= names
        exp = {"story.mjs", "production.mjs"} <= names
        if "CMO.md" in names:
            prod = os.path.join(d, "production")
            return d, prod if os.path.isdir(prod) else d
        if hf or exp:
            parent = os.path.dirname(d)
            if os.path.exists(os.path.join(parent, "CMO.md")):
                return parent, d
            return d, d
        parent = os.path.dirname(d)
        if parent == d:
            return None, None
        d = parent


class Guard:
    def __init__(self, root, prod, context):
        self.root = root
        self.prod = prod
        self.context = context  # {"command": ...} or {"file": ...}

    def deny(self, hook, message):
        try:
            if self.prod:
                reports = os.path.join(self.prod, "reports")
            else:
                data = os.environ.get("CLAUDE_PLUGIN_DATA", "")
                if not data:
                    raise OSError("nowhere to log")
                reports = data
            os.makedirs(reports, exist_ok=True)
            line = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "hook": hook, "message": message}
            line.update(self.context)
            with open(os.path.join(reports, "hooks.log"), "a") as fh:
                fh.write(json.dumps(line) + "\n")
        except OSError:
            pass  # logging failure never blocks the deny itself
        print(f"CMO-GUARD: {message}", file=sys.stderr)
        sys.exit(2)


HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)(\w+)\1")
INTERPRETERS = {"bash", "sh", "zsh", "ksh", "dash", "python", "python2", "python3", "node"}


def strip_heredocs(command):
    """Remove heredoc BODIES: text fed to a command is data, not commands.
    (Live false positive 2026-10-04: a log line quoting the publish command
    inside a heredoc tripped global H1.)"""
    out = []
    rest = command
    while True:
        m = HEREDOC_RE.search(rest)
        if not m:
            out.append(rest)
            break
        nl = rest.find("\n", m.end())
        if nl == -1:
            out.append(rest)
            break
        # text fed to an INTERPRETER is executable, not prose — keep it
        seg_start = max(rest.rfind(c, 0, m.start()) for c in "\n;|&") + 1
        first = (rest[seg_start:m.start()].strip().split() or [""])[0]
        interp = os.path.basename(first.strip("()")) in INTERPRETERS
        term = m.group(2)
        body_end = re.search(r"^\t*" + re.escape(term) + r"\s*$", rest[nl + 1 :], re.M)
        if not body_end:
            out.append(rest if interp else rest[: nl + 1])
            break  # unterminated heredoc
        if interp:
            keep = nl + 1 + body_end.end()
            out.append(rest[:keep])
            rest = rest[keep:]
        else:
            out.append(rest[: nl + 1])
            rest = rest[nl + 1 + body_end.start() :]
    return "".join(out)


def tokens(command):
    out = []
    for seg in re.split(r"(?:&&|\|\||[;|&\n])", command.replace("(", " ").replace(")", " ")):
        try:
            out.append(shlex.split(seg))
        except ValueError:
            out.append(seg.split())
    return out


def hyperframes_invocation(command):
    for toks in tokens(command):
        toks = list(toks)
        while toks and (
            toks[0] in WRAPPERS
            or (re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", toks[0]))
        ):
            toks.pop(0)
        if toks and os.path.basename(toks[0]) == "hyperframes":
            return True
    return False


def args_with_extension(command, extensions):
    hits = []
    for toks in tokens(command):
        for tok in toks:
            if tok.lower().rstrip("'\"").endswith(extensions):
                hits.append(tok)
    return hits


def remote_hosts(cwd):
    try:
        out = subprocess.run(
            ["git", "remote", "-v"], cwd=cwd, capture_output=True, text=True, timeout=5
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    hosts = set()
    for url in re.findall(r"\s(\S+)\s+\(", out):
        m = re.match(r"[a-z+]+://([^/@]+@)?([^/:]+)", url) or re.match(r"([^@]+@)?([^:/]+):", url)
        if m:
            hosts.add(m.group(2).lower())
    return sorted(hosts)


def external_hosts(hosts):
    return [h for h in hosts if not any(h == s or h.endswith("." + s) for s in INTERNAL_HOST_SUFFIXES)]


def effective_project(command, cwd):
    root, prod = find_project(cwd)
    if root:
        return root, prod
    cur = cwd
    for toks in tokens(command):
        cands = []
        if toks and toks[0] in ("cd", "pushd") and len(toks) > 1 and not toks[1].startswith("-"):
            target = os.path.expanduser(toks[1])
            cur = target if os.path.isabs(target) else os.path.join(cur, target)
            cands.append(cur)
        for i, tok in enumerate(toks):
            if tok in ("-C", "--prefix") and i + 1 < len(toks):
                cands.append(toks[i + 1])
            elif tok.startswith("--prefix="):
                cands.append(tok.split("=", 1)[1])
        cands.extend(tok for tok in toks[1:] if "/" in tok and not tok.startswith("-"))
        for cand in cands:
            path = os.path.expanduser(cand)
            if not os.path.isabs(path):
                path = os.path.join(cwd, path)
            start = path if os.path.isdir(path) else os.path.dirname(path)
            if not os.path.isdir(start):
                continue
            root, prod = find_project(start)
            if root:
                return root, prod
    return None, None


def guard_bash(guard, command, cwd):
    hf_call = hyperframes_invocation(command)

    # ---- H1: nothing leaves the machine --------------------------------
    if hf_call and re.search(r"\bpublish\b", command):
        guard.deny("H1", "hyperframes publish sends material off this machine. Footage, memos and fonts never leave the machine; render locally instead.")
    if hf_call and re.search(r"--cloud\b|--lambda\b|cloud-run", command):
        guard.deny("H1", "cloud rendering sends material off this machine. This reel renders locally only; drop the cloud flag.")
    if UPLOADER_RE.search(command):
        carried = args_with_extension(command, MEDIA_EXT + FONT_EXT)
        for toks in tokens(command):
            carried.extend(tok for tok in toks
                           if any(d in tok for d in ("assets/footage", "assets/audio"))
                           or tok.rstrip("/").endswith("renders"))
        if carried:
            guard.deny("H1", f"this command would send {', '.join(carried)} somewhere. Footage and fonts never leave the machine; share the reel folder path with the owner instead.")

    # ---- H2: telemetry off, always -------------------------------------
    if hf_call and "HYPERFRAMES_NO_TELEMETRY=1" not in command:
        guard.deny("H2", "every hyperframes command must carry HYPERFRAMES_NO_TELEMETRY=1 — prepend it and re-run.")

    # ---- H3-H6 need a reel project; H1/H2 above are global --------------
    if not guard.root:
        allow()

    # ---- H4b: the approval marker is approve.py's alone -----------------
    if "APPROVED-" in command and "approve.py" not in command:
        if re.search(r"(?:touch|cp|mv|tee|install)\b[^;|&]*APPROVED-|>\s*[^;|&]*APPROVED-", command):
            guard.deny("H4", "the approval marker is written only by /cmo:review (scripts/approve.py) after the owner approves — never by hand.")

    # ---- H4: render gate (Hyperframes forms; the explainer pipeline has
    # its own code gates and never writes check.json) ----------------------
    if RENDER_RE.search(command) and os.path.exists(os.path.join(guard.prod, "hyperframes.json")):
        check_path = os.path.join(guard.prod, "reports", "check.json")
        if not os.path.exists(check_path):
            guard.deny("H4", "rendering needs a green check first — reports/check.json not found. Run the checks (npm run check), then get the cut approved via /cmo:review.")
        try:
            check = json.load(open(check_path))
        except (OSError, ValueError):
            guard.deny("H4", "reports/check.json is unreadable — re-run the checks (npm run check) before rendering.")
        if check.get("ok") is not True:
            guard.deny("H4", "the last check run failed — fix what reports/check.json lists, re-run the checks, then render.")
        # a review DRAFT (out/review/, unshippable) needs only the green
        # check — it exists so the owner can WATCH a cut before approving,
        # without the approval deadlock Studio's audio failures cause
        if "--review-draft" not in command and "render:review" not in command:
            fp = check.get("fingerprint") or check.get("compositionFingerprint") or ""
            marker = os.path.join(guard.prod, "reports", f"APPROVED-{fp}")
            if not fp or not os.path.exists(marker):
                guard.deny("H4", f"this cut has no owner approval — /cmo:review writes reports/APPROVED-{fp or '<fingerprint>'} after the owner approves (or logs an owner-authority skip). Nothing renders before that. (A pre-approval watch copy is allowed: npm run render:review.)")

    # ---- H5: receipt drift ----------------------------------------------
    if PRODUCTION_RE.search(command):
        receipt_path = next(
            (p for p in (
                os.path.join(guard.prod, "reports", "source-receipt.json"),
                os.path.join(guard.prod, "out", "source-receipt.json"),
            ) if os.path.exists(p)),
            None,
        )
        if receipt_path:
            try:
                receipt = json.load(open(receipt_path))
                entries = receipt.get("files") or []
            except (OSError, ValueError):
                entries = []
            for entry in entries:
                path = entry.get("path") or ""
                if not os.path.isabs(path):
                    path = os.path.join(guard.root, path)
                try:
                    h = hashlib.sha256()
                    with open(path, "rb") as fh:
                        for chunk in iter(lambda: fh.read(1 << 20), b""):
                            h.update(chunk)
                    digest = h.hexdigest()
                except OSError:
                    digest = "<missing>"
                if digest != entry.get("sha256"):
                    guard.deny("H5", f"{os.path.basename(path)} changed since the source receipt was written — inputs are frozen once registered. Rebaselining is an explicit owner action: re-run /cmo:brief with the owner, never edit the receipt by hand.")

    # ---- H6: git never stages media; fonts stay internal ----------------
    add_match = re.search(r"\bgit\b[^;|&]*\badd\b(.*)", command)
    if add_match:
        try:
            add_args = [a for a in shlex.split(add_match.group(1)) if a]
        except ValueError:
            add_args = add_match.group(1).split()
        media = [a for a in add_args if a.lower().endswith(MEDIA_EXT)]
        if media:
            guard.deny("H6", f"generated media is never committed ({', '.join(media)}) — it stays local and .gitignored; deliver by path, not by git.")
        if any(a in (".", "-A", "--all") for a in add_args):
            gi = os.path.join(guard.root, ".gitignore")
            covered = False
            try:
                covered = "*.mp4" in open(gi).read()
            except OSError:
                covered = False
            if not covered:
                guard.deny("H6", "git add . in a reel without a media-covering .gitignore can stage footage — add the reel .gitignore (/cmo:new writes it) first, or add files by name.")
        fonts = [a for a in add_args
                 if a.lower().endswith(FONT_EXT)
                 or "assets/fonts" in a.lower() or a.rstrip("/").lower().endswith("fonts")]
        if fonts:
            ext = external_hosts(remote_hosts(cwd))
            if ext:
                guard.deny("H6", f"HPE Graphik is internally licensed — fonts must not be pushed to {', '.join(ext)}. Keep fonts out of any repo with a non-internal remote.")
    if re.search(r"\bgit\b[^;|&]*\bcommit\b", command):
        try:
            staged = subprocess.run(
                ["git", "diff", "--cached", "--name-only"],
                cwd=cwd, capture_output=True, text=True, timeout=5,
            ).stdout.splitlines()
        except (OSError, subprocess.SubprocessError):
            staged = []
        media = [f for f in staged if f.lower().endswith(MEDIA_EXT)]
        if media:
            guard.deny("H6", f"staged media must not be committed: {', '.join(media)} — unstage it (git restore --staged) and fix the .gitignore.")
        fonts = [f for f in staged if f.lower().endswith(FONT_EXT)]
        if fonts and external_hosts(remote_hosts(cwd)):
            guard.deny("H6", f"HPE Graphik is internally licensed — unstage {', '.join(fonts)} before committing to a repo with a non-internal remote.")

    allow()


def guard_edit(guard, file_path):
    name = os.path.basename(file_path)
    if name.startswith("APPROVED-") and os.path.basename(os.path.dirname(file_path)) == "reports":
        guard.deny("H4", "the approval marker is written only by /cmo:review (scripts/approve.py) after the owner approves — never by hand.")

    # H3 only arms when the project is script-driven (a scenes.mjs exists)
    scenes_dir = None
    for cand in (guard.prod, guard.root):
        if os.path.exists(os.path.join(cand, "scenes.mjs")):
            scenes_dir = os.path.realpath(cand)
            break
    if not scenes_dir:
        allow()
    target = os.path.realpath(file_path)
    if not (target == scenes_dir or target.startswith(scenes_dir + os.sep)):
        allow()
    rel = os.path.relpath(target, scenes_dir)
    parts = rel.split(os.sep)
    generated = (
        rel in GENERATED_NAMES
        or (parts[0] == "compositions" and rel.endswith(".html"))
        or rel.endswith(".motion.json")
        or parts[0] == "reports"
    )
    if generated:
        guard.deny("H3", f"{rel} is generated — the script is data and everything else regenerates. Edit scenes.mjs (or the screenplay) and re-run the build instead.")
    allow()


def main():
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        allow()
    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}
    cwd = payload.get("cwd") or os.getcwd()

    if tool == "Bash":
        command = tool_input.get("command") or ""
        analysed = strip_heredocs(command)
        root, prod = effective_project(analysed, cwd)
        guard_bash(Guard(root, prod, {"command": command}), analysed, cwd)
    elif tool in WRITE_TOOLS:
        file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
        if not file_path:
            allow()
        root, prod = find_project(os.path.dirname(os.path.realpath(file_path)))
        if not root:
            allow()
        guard_edit(Guard(root, prod, {"file": file_path}), file_path)
    allow()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)  # fail open: a broken guard must never block daily work
