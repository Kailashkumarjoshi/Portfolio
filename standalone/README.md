# The one-file version

`index.html` is the whole thing. No installing, no accounts, no build step.

**To look at it:** double-click `index.html`. That is all.

**To put it online:** upload this folder to any host — Netlify Drop, GitHub
Pages, or the "public_html" folder of any old web host. Nothing needs to be
configured.

---

## Writing your own story

Open `index.html` in any text editor (TextEdit, Notepad, VS Code — anything).
Near the middle you will find a line that says:

```
  ✎  YOUR STORY GOES HERE
```

Everything between there and the line that says *nothing below needs editing*
is yours. Save the file, refresh the page, and it is live.

**To add a memory,** copy one whole block — from its `{` to its `}`, including
the comma at the end — paste it where you want it in the list, and write over
the words. The order they appear in the file is the order they are told in.

**For photos,** make a folder called `photos` next to `index.html`, put your
pictures in it, and write `"photos/whatever.jpg"`. A link to a picture on the
web works too. The first photo on a memory is the one shown on its card.

**For videos,** either drop an `.mp4` in the `photos` folder the same way, or
paste a YouTube or Vimeo link — both are recognised automatically.

**Music** is already there. The page plays its own soft romantic theme —
written as it goes, so it never loops and there is no file to find. It starts
when someone presses *Begin Our Journey*, because browsers will not play sound
before a visitor taps something. In `SETTINGS`:

```
music: { builtIn: true, title: "Our Theme", volume: 0.5 },
```

Turn `builtIn` to `false` for silence, or change `volume` (0 to 1) if it is
loud or quiet for your taste.

**To use a song of your own instead,** put an `.mp3` next to the file and set
`song` in `SETTINGS`. It replaces the theme completely. Times are written the
way you say them: `start: "1:24"`. Leave `end` empty to play the whole song.
A single memory can have its own `song` too, and it takes over while that
memory is open.

Three small things worth knowing:

- Leave a **blank line** between paragraphs in a story and they stay separate
  paragraphs on the page.
- Memories with the **same chapter name** get a heading above the first of them.
- The dots down the right-hand edge jump straight to any memory, so a long
  story never has to be scrolled through to get somewhere.

---

## If you would rather not edit a file

The full version of this project — in the folder above — has an admin panel:
you log in, fill in a form, drag memories into order, and never touch code. It
needs a free Supabase account and about ten minutes of setup, described in the
main README. Same design, same wool thread.
