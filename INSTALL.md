# Installing the film studio

This gets the plugin working inside your Claude Code, so that typing
`/cmo:new` in a session starts a film. Plan on fifteen minutes, most of it
waiting for installs. You do not need to know anything about video, audio,
or how the plugin works.

## 1. What your machine needs

You need a Mac with [Claude Code](https://claude.com/claude-code) already
working. Then, in Terminal, install the tools the studio uses behind the
scenes:

    brew install node uv ffmpeg

If you plan to make films from screen recordings, also install Apple's
command line tools (used to read text inside your footage):

    xcode-select --install

If your Mac later complains that the Swift compiler and SDK are "out of
step", run Software Update and install the newest "Command Line Tools for
Xcode" it offers. That fixes it.

## 2. Get this folder onto your machine

Clone this repository, or copy the whole folder from a colleague. Where
you put it does not matter. For the rest of this page we assume:

    ~/tme-team

## 3. Add the fonts

The films use HPE's brand typeface, which is licensed for internal use and
therefore not included in the repository. Follow the short instructions in
`packs/PROVISIONING.md` — it is a matter of copying four font files into
three folders, and you can take them from any colleague's working install.
The studio checks the fonts before building anything, so if you get this
wrong it tells you plainly.

## 4. Tell Claude Code about the plugin

Pick one of these.

**The simple way (loads in every session):** put a link to the folder in
Claude Code's skills directory:

    mkdir -p ~/.claude/skills
    ln -s ~/tme-team ~/.claude/skills/cmo

**The cautious way (loads only when you ask):** start Claude Code with a
flag whenever you want to make films:

    claude --plugin-dir ~/tme-team

The simple way is fine for almost everyone. The plugin stays quietly out
of the way when you are not making a film.

## 5. Check it worked

Start a new Claude Code session and type:

    /cmo:new help

You should see a usage page describing the three kinds of film and the
four-person review team. If instead Claude says it doesn't know that
command, the plugin didn't load — the usual cause is a typo in the path
from step 4.

## 6. Two things worth knowing before your first film

Everything you record and every document you provide stays on your
computer. The one exception: when you approve a narration script, that
text (and nothing else) is sent to Microsoft's voice service to be read
aloud — and the studio asks you, in so many words, before doing it.

The first time a film checks its own narration, a small speech-recognition
model downloads onto your machine (a one-time wait of a minute or two).
Your audio never leaves the computer for that check.

That's it. For actually making a film, read `HOWTO.md`.
