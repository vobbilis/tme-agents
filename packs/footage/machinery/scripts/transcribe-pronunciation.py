"""Local ASR diagnostic of actual audio; never a substitute for human listening.

Run through a pinned faster-whisper environment. The public model is downloaded
to this reel's ignored output directory; audio stays on this computer. No prompt
or terminology hint is supplied to the recognizer.
"""
import argparse
import hashlib
import json
from pathlib import Path

from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("--model", default="base.en")
parser.add_argument("files", nargs="+")
parser.add_argument("--output", required=True)
args = parser.parse_args()
directory = Path(__file__).resolve().parent.parent / "reports" / "pronunciation-review"
model = WhisperModel(args.model, device="cpu", compute_type="int8", download_root=str(directory / "models"))
results = []
for file in args.files:
    segments, info = model.transcribe(file, language="en", beam_size=5, temperature=0,
                                      condition_on_previous_text=False, vad_filter=False)
    chunks = [{"start": s.start, "end": s.end, "text": s.text,
               "avg_logprob": s.avg_logprob} for s in segments]
    result = {"file": str(Path(file).resolve()),
              "audioSha256": hashlib.file_digest(Path(file).open("rb"), "sha256").hexdigest(),
              "transcript": " ".join(s["text"].strip() for s in chunks),
              "duration": info.duration, "segments": chunks}
    results.append(result)
    print(json.dumps(result), flush=True)
Path(args.output).write_text(json.dumps({"model": args.model, "localAudioOnly": True,
                                        "vocabularyPrompt": None, "humanListeningVerified": False,
                                        "results": results}, indent=2))
