#!/usr/bin/env python3
"""Approval-marker writer for /cmo:review (build step 4).

The ONLY writer of reports/APPROVED-<fingerprint> — the marker the H4 hook
demands before render/finish. Two paths, both requiring a green check.json
(the quality floor is not skippable; the approval STOP is). Hyperframes
reels prove it with reports/check.json; explainer reels with
out/verification-report.json (technicalPass + sha256):

  approve.py --reel R --by NAME                the owner approved the cut
                                               (--by is REQUIRED on both paths)
  approve.py --reel R --skip --quote "..."     lesson-48 owner-authority
                                               skip, the owner's words
                                               recorded VERBATIM

Exit 0 marker written (path on stdout) · 1 refused, reason on stderr.
Plain python3 + stdlib. Contract pinned by hooks/tests/test_approve.py —
change that first.
"""

import argparse
import json
import os
import sys
import time


def fail(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--reel", required=True)
    ap.add_argument("--by", default="")
    ap.add_argument("--skip", action="store_true")
    ap.add_argument("--quote", default=None)
    args = ap.parse_args()

    reports = os.path.join(args.reel, "production", "reports")
    check_path = os.path.join(reports, "check.json")
    vr_path = os.path.join(args.reel, "production", "out", "verification-report.json")
    if os.path.exists(check_path):
        try:
            check = json.load(open(check_path))
        except (OSError, ValueError):
            fail("reports/check.json is unreadable — re-run the checks.")
        if check.get("ok") is not True:
            fail("the last check run is not green — fix what check.json lists first. "
                 "The quality floor is not skippable; only the approval stop is.")
        fp = check.get("fingerprint") or check.get("compositionFingerprint")
        if not fp:
            fail("check.json carries no fingerprint — re-run the checks so the marker can bind to this exact cut.")
    elif os.path.exists(vr_path):
        # explainer form: the pipeline writes out/verification-report.json
        try:
            report = json.load(open(vr_path))
        except (OSError, ValueError):
            fail("out/verification-report.json is unreadable — re-run verify.")
        if report.get("technicalPass") is not True:
            fail("the last verification is not green — fix what verification-report.json lists first. "
                 "The quality floor is not skippable; only the approval stop is.")
        fp = report.get("sha256") or report.get("version")
        if not fp:
            fail("verification-report.json carries no sha256/version — re-run verify so the marker can bind to this exact cut.")
    else:
        fail("nothing is approvable yet — run the checks (Hyperframes: npm run check → reports/check.json; "
             "explainer: node verify.mjs → out/verification-report.json) first.")

    if args.skip:
        if not (args.quote or "").strip():
            fail("an owner-authority skip is never inferred — record the owner's words verbatim with --quote \"...\".")
        marker = {"fingerprint": fp, "approvedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                  "by": args.by, "skip": True, "quote": args.quote}
    else:
        marker = {"fingerprint": fp, "approvedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                  "by": args.by, "skip": False}

    if not (args.by or "").strip():
        fail("an approval needs a name — pass --by \"<who approved>\"; it is recorded in the marker and printed in the handover.")

    os.makedirs(reports, exist_ok=True)
    path = os.path.join(reports, f"APPROVED-{fp}")
    with open(path, "w") as fh:
        json.dump(marker, fh, indent=2)
        fh.write("\n")
    print(path)


if __name__ == "__main__":
    main()
