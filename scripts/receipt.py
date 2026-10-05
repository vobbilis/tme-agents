#!/usr/bin/env python3
"""Preservation-receipt tool for /cmo:brief (build step 4).

Freezes the owner's inputs: every registered file gets an {id, path,
sha256} entry in the reel's source receipt — the same entries the H5 hook
and the explainer's checkPreserved() verify before every production step.
Changing a frozen input is never implicit: `rebaseline` demands the owner's
reason and records it.

  receipt.py add        --reel R --id ID --path P
  receipt.py verify     --reel R
  receipt.py rebaseline --reel R --reason "..."

Exit 0 ok · 1 refused/drift (plain English on stdout/stderr).
Plain python3 + stdlib. Contract pinned by hooks/tests/test_receipt.py —
change that first.
"""

import argparse
import hashlib
import json
import os
import sys
import time


def fail(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def receipt_path(reel):
    for rel in ("production/reports/source-receipt.json", "production/out/source-receipt.json"):
        p = os.path.join(reel, rel)
        if os.path.exists(p):
            return p
    return None


def load(path):
    with open(path) as fh:
        return json.load(fh)


def save(path, data):
    with open(path, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def stored_path(reel, path):
    real = os.path.realpath(path)
    root = os.path.realpath(reel)
    if real == root or real.startswith(root + os.sep):
        return os.path.relpath(real, root)
    return real


def resolve_entry(reel, entry_path):
    if os.path.isabs(entry_path):
        return entry_path
    return os.path.join(reel, entry_path)


def cmd_add(args):
    rp = receipt_path(args.reel)
    if not rp:
        fail("no source receipt found — /cmo:new writes the first one; run it (or check the reel path).")
    if not os.path.isfile(args.path):
        fail(f"input file not found: {args.path}")
    data = load(rp)
    files = data.setdefault("files", [])
    if any(e.get("id") == args.id for e in files):
        fail(f"'{args.id}' is already registered — inputs are frozen once added. "
             "Replacing one is a rebaseline: an explicit owner action with a reason "
             "(receipt.py rebaseline --reason \"...\").")
    files.append({"id": args.id, "path": stored_path(args.reel, args.path),
                  "sha256": sha256(args.path)})
    save(rp, data)
    print(f"registered {args.id} ({files[-1]['path']})")


def cmd_verify(args):
    rp = receipt_path(args.reel)
    if not rp:
        fail("no source receipt found — nothing is frozen yet; /cmo:new writes it, /cmo:brief fills it.")
    data = load(rp)
    drifted = []
    for entry in data.get("files", []):
        p = resolve_entry(args.reel, entry.get("path", ""))
        try:
            ok = sha256(p) == entry.get("sha256")
        except OSError:
            ok = False
        if not ok:
            drifted.append(entry.get("path", "?"))
    if drifted:
        for d in drifted:
            print(f"DRIFTED {d}")
        fail("inputs changed since the receipt was written — rebaselining is an explicit owner action.")
    print(f"OK — {len(data.get('files', []))} entries match")


def cmd_rebaseline(args):
    if not (args.reason or "").strip():
        fail("a rebaseline needs the owner's reason — it is never implicit (--reason \"...\").")
    rp = receipt_path(args.reel)
    if not rp:
        fail("no source receipt found.")
    data = load(rp)
    new_hashes = []
    for entry in data.get("files", []):
        p = resolve_entry(args.reel, entry.get("path", ""))
        try:
            new_hashes.append(sha256(p))
        except OSError:
            fail(f"cannot rebaseline: {entry.get('path')} is missing — restore it or remove the entry with the owner.")
    for entry, digest in zip(data.get("files", []), new_hashes):
        entry["sha256"] = digest
    data.setdefault("rebaselines", []).append(
        {"at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "reason": args.reason.strip()})
    save(rp, data)
    print(f"rebaselined {len(new_hashes)} entries — reason recorded")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("add", "verify", "rebaseline"):
        s = sub.add_parser(name)
        s.add_argument("--reel", required=True)
        if name == "add":
            s.add_argument("--id", required=True)
            s.add_argument("--path", required=True)
        if name == "rebaseline":
            s.add_argument("--reason", default="")
    args = ap.parse_args()
    {"add": cmd_add, "verify": cmd_verify, "rebaseline": cmd_rebaseline}[args.cmd](args)


if __name__ == "__main__":
    main()
