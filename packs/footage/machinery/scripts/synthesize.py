"""Generate one Edge TTS clip and its WordBoundary metadata."""

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
