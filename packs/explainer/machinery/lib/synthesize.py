"""Generate audio and word metadata in the same pinned edge-tts stream.

The Node driver supplies a JSON request on stdin. It validates timing before
promoting these temporary files to the reel's narration cache.
"""

import asyncio
import json
import sys

import edge_tts


async def main():
    request = json.load(sys.stdin)
    if edge_tts.__version__ != "7.2.8":
        raise RuntimeError("This reel requires edge-tts 7.2.8")
    speech = edge_tts.Communicate(
        request["text"],
        request["voice"],
        rate=request["rate"],
        boundary="WordBoundary",
    )
    await speech.save(request["audio"], request["metadata"])


if __name__ == "__main__":
    asyncio.run(main())
