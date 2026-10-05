# Making a film

This is the whole process, start to finish, as you will experience it.
It assumes the plugin is installed (see `INSTALL.md`). No film-making
knowledge is needed — that is the point.

## What you bring

One of three things:

- **Screen recordings** of real work — or just a product and nothing
  recorded yet. Both are fine; see "If you have nothing recorded yet"
  below. If you do record yourself, record generously: full screen,
  native quality, no need to be tidy. One tip from experience: rename
  recordings to something simple like `demo-session.mov` — the names
  macOS gives them contain an invisible character that causes trouble
  later.
- **An architecture story** — systems and how they connect, told to an
  audience that is worried about something.
- **A way of working** — a model, a method, a policy. Nothing to show on
  screen; the film illustrates it.

And about an hour of your attention, spread over the production in small
pieces. You will never be asked to edit video, fix audio, or read an
error trace. Everything you do is one of four things: answer a question,
approve a piece of text, say yes or no to a picture, or watch a cut and
say what bothered you.

## If you have nothing recorded yet

You do not need to know how to capture a product. Two ways, pick either:

**Record it yourself.** Press Cmd-Shift-5, choose "Record Entire Screen",
click through the product the way you'd show it to a customer, then stop
from the little icon in the menu bar. That file is your footage. Don't
worry about mistakes or pauses — only the good parts end up in the film.

**Or let the studio record it — from a demo instance.** Tell it, in the
session, that you have a product but no recording. Two things to know,
both deliberate: the studio opens its own browser window (it cannot see
or reuse your Chrome), and it will only film a product running with
made-up demo data — it refuses live systems holding real customer data,
so nothing private can end up on film by accident. You give it the demo
instance's address and describe in plain words which screens to show;
for login, either give it the steps or have it open the window visibly,
log in yourself, and it continues once your first screen is really there.
It then navigates screen by screen, proves each one is actually showing
what you asked (not a spinner), and records. If it runs into a product
bug on the way, it documents the bug and finds another honest route
rather than hiding it. This is the youngest part of the studio, so expect
a little more back-and-forth here than elsewhere.

## Starting

Make a folder for the film, open Terminal there, start Claude Code, and
type:

    /cmo:new

It asks what you have to show, sets everything up, checks your machine,
and tells you what to run next. Every command in this plugin works this
way: it finishes by naming the next step, and any of them will explain
itself if you type `help` after it, like `/cmo:brief help`.

If you ever close the terminal, nothing is lost. Open it in the same
folder, start Claude Code, and run the command you were on — the film's
folder holds all the state.

## The stages, in the order they happen

**`/cmo:brief` — agree on what the film may claim.** It drafts the brief
from what you have already said and you correct it once. If you brought
recordings, it watches them for you — it reads the text on screen, frame
by frame, and gives you a summary of what happens when, so you never have
to scrub through an hour of footage. Together you write down what each
recording shows, what it does *not* prove, and any seconds that must never
appear (a lock screen, a colleague's name). Those boundaries are enforced
by machinery afterwards, not by good intentions.

**`/cmo:screenplay` — write the story together.** Scenes come to you a few
at a time. Every line of narration is traced to something you said or
something the footage shows; when the writer wants to say something you
haven't confirmed, it stops and asks instead of guessing. A fact-checker
is offered before each round — take it or skip it, your call. The stage
ends with one explicit question: approve this exact text to be read aloud?
Nothing is synthesized before your yes.

**`/cmo:cuts` — choose the shots (recordings only).** Working from its
summary of your footage, you say which parts belong in the film and what
deserves emphasis. The camera finds the thing the narrator is naming and
zooms to frame it, moving on as the narration moves. You answer one
question per shot: is the thing being talked about readable and in frame?

**`/cmo:assemble` — walk away.** The one stage that needs nothing from
you. Narration, timing, assembly and a long list of checks run in a loop
until everything is green. If something needs a human decision you get a
three-line note saying exactly what, in plain words.

**`/cmo:review` — watch it and direct.** You get a watch copy before
anything is final. Say what a director would say — "the voice feels slow",
"that label at 2:41 is wrong" — and a corrected cut comes back in minutes.
(That first example is real: it took one sentence from the owner and about
three minutes.) Every earlier cut is kept; nothing is overwritten. When
you are happy, your approval is recorded with your name against that exact
cut, and only then can a final version be rendered.

**`/cmo:deliver` — the finished film.** The approved cut is rendered to a
consistent delivery standard — broadcast loudness, captions you can turn
on and off, chapter marks — and verified frame by frame. The film lands in
the project's `renders/` folder as an ordinary MP4. Alongside it, the
producer writes a production record stating exactly what was made, from
what, who approved it, and who has actually watched it. If nobody has
watched the finished file, the record says so in writing rather than
rounding up to "done".

## What it will not do

It will not claim anything you didn't say or the evidence doesn't show.
It will not speed up or loop footage to make things look better. It will
not let excluded seconds into a cut. It will not send your recordings or
documents anywhere. It will not call a film done until a named person has
watched it. And none of its four reviewers can approve anything — only
you can.

## When something looks wrong

Say so in plain words, in the session. The studio speaks plain words back.
If a tool on your machine is missing or broken, you get a sentence telling
you what to install or change — never a stack trace. And if you are ever
unsure where you are in the process, type the last command you remember
with `help` after it.
