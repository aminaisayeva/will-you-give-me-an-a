// Terminal Academy curriculum: 7 modules that take a beginner from "what is
// this window?" to writing their own shell script. Every lesson runs in a
// fresh practice shell (see sandbox.ts) whose home folder is `seed`.

import * as c from "@/lib/shell/checks";
import type { CommandRecord, Shell } from "@/lib/shell/shell";
import type { Module } from "./types";

// --- small check helpers ----------------------------------------------------

const absPath = (sh: Shell, path: string) => (path.startsWith("/") ? path : `${sh.home}/${path}`.replace(/\/$/, ""));

// Was the learner ever in `path` (or are they there now)?
const visited = (sh: Shell, path: string) => {
  const target = absPath(sh, path);
  return sh.cwd === target || sh.log.some((r) => r.cwd === target);
};

const nonEmptyLines = (text: string) => text.split("\n").filter((l) => l.trim() !== "");

const lastPart = (path: string) => path.split("/").filter(Boolean).pop() ?? "";

// Every successful run of a script file named `file`, however it was started:
// `./greet.sh a b`, `~/scripts/greet.sh a b`, `sh greet.sh a b`, `zsh greet.sh a b`...
function scriptRuns(sh: Shell, file: string): { args: string[]; stdout: string }[] {
  const runners = ["sh", "bash", "zsh", "source"];
  return sh.log
    .filter((r: CommandRecord) => r.exit === 0)
    .flatMap((r) => {
      if (r.name.includes("/") && lastPart(r.name) === file) return [{ args: r.args, stdout: r.stdout }];
      if (runners.includes(r.name) && r.args[0] && lastPart(r.args[0]) === file) return [{ args: r.args.slice(1), stdout: r.stdout }];
      return [];
    });
}

// The first of `paths` that exists as a file (lets a learner put a file in a
// slightly different folder than we expected).
const firstFile = (sh: Shell, ...paths: string[]) => paths.find((p) => c.isFile(sh, p)) ?? paths[0];

// A shell variable or environment variable, whichever is set.
const varValue = (sh: Shell, name: string) => sh.vars[name] ?? sh.env[name] ?? "";

// --- seed content -------------------------------------------------------------

const GROCERY_LIST = `Oat milk
Everything bagels (from the place on Broadway)
Bananas
Instant ramen x6
Hot sauce
Frozen dumplings
Coffee beans (the good ones)
`;

const PLAYLIST = `Good Luck, Babe! - Chappell Roan
Empire State of Mind - JAY-Z, Alicia Keys
Espresso - Sabrina Carpenter
New York, New York - Frank Sinatra
Midwest Midnight - The Cornfields
Pink Pony Club - Chappell Roan
Welcome to New York - Taylor Swift
Juna - Clairo
Flowers - Miley Cyrus
Ivy - Frank Ocean
Bags - Clairo
Nonsense - Sabrina Carpenter
`;

const LIT_HUM_NOTES = `LIT HUM - Week 6 - The Odyssey
Prof talked for 20 mins about guest-friendship (xenia)
Hosts feed the stranger BEFORE asking their name
Breaking xenia = very bad news (see: the suitors)
Odysseus is "polytropos" - a man of many turns
Telemachus finally grows up in books 1-4
Penelope's weaving trick: weave by day, unravel by night
Question for seminar: is Odysseus actually a good leader?
Reading for Thursday: books 9-12 (the Cyclops!)
Reminder: response paper due Friday at 5pm on CourseWorks
`;

const GROUP_CHAT = `maya: anyone at butler rn
jordan: 6th floor Butler, come thru
sam: omw, saving me a seat??
priya: BUTLER IS PACKED. going to the law library instead
maya: lol the law library is a vibe tho
jordan: who wants pizza after
sam: koronet pizza is the move
priya: lol you just want the giant slice
maya: dining hall closes at 8 btw
jordan: lol ok fine pizza at 9
sam: the 1 train was delayed AGAIN today
priya: classic mta
maya: also saw the bodega cat on 112th, he's thriving
`;

const DINING_VOTES = `JJ's Place
John Jay
Ferris
JJ's Place
Hewitt
John Jay
JJ's Place
Ferris
John Jay
JJ's Place
Hewitt
Ferris
John Jay
JJ's Place
`;

const STEPS = `8234 Monday
15402 Tuesday
6120 Wednesday
21877 Thursday
9955 Friday
18310 Saturday
4401 Sunday
`;

const MUSIC: Record<string, string> = {
  "espresso.mp3": "(audio)",
  "empire_state_of_mind.mp3": "(audio)",
  "good_luck_babe.mp3": "(audio)",
  "ivy.mp3": "(audio)",
  "juna.mp3": "(audio)",
  "pink_pony_club.mp3": "(audio)",
  "welcome_to_new_york.mp3": "(audio)",
};

// --- the course ----------------------------------------------------------------

export const MODULES: Module[] = [
  // ===========================================================================
  {
    id: 1,
    title: "First Steps",
    summary: "Meet the terminal, find out where you are, look around, move around, and read files.",
    free: true,
    lessons: [
      {
        id: "1-1-meet-the-terminal",
        title: "Meet the terminal",
        intro: [
          "The **terminal** is a way to talk to your Mac by typing instead of clicking. Everything you do in Finder can be done here, plus a lot that can't be done anywhere else: coding, running servers, wrangling data. Every engineer you'll ever intern next to lives in this window.",
          "The text ending in `%` is the **prompt**. It's the shell (on a Mac, a program called zsh) saying \"ready when you are.\" Here it reads `student@academy ~ %`: who you are, the computer's name, and which folder you're in. `~` is short for your home folder.",
          "A **command** is a word you type and run by pressing Enter. Some commands just answer a question: `whoami` prints your username, and `date` prints today's date and time. If you make a typo, nothing breaks. You'll just see `zsh: command not found` and can try again.",
        ],
        examples: [
          { command: "whoami", note: "Prints the username you're logged in as." },
          { command: "date", note: "Prints the current date and time." },
          { command: "clear", note: "Wipes the screen when it gets cluttered. Your files are untouched." },
        ],
        seed: {
          "welcome.txt": "Welcome to Terminal Academy, Sam!\n",
        },
        tasks: [
          { text: "Run `whoami` to see your username.", check: (sh) => c.ran(sh, "whoami") },
          { text: "Run `date` to see the date and time.", check: (sh) => c.ran(sh, "date") },
        ],
        hints: [
          "Click in the terminal, type the command exactly, then press Enter.",
          "Commands are lowercase and have no spaces: `whoami` is one word.",
          "Type `whoami`, press Enter, then type `date` and press Enter.",
        ],
        recap: "You ran your first commands. The pattern never changes: type a command at the prompt, press Enter, read what comes back.",
        solution: ["whoami", "date"],
      },
      {
        id: "1-2-where-am-i",
        title: "Where am I?",
        intro: [
          "Your Mac's files live in a big tree of folders. In the terminal you're always standing **inside one folder**, called the **working directory**. Commands you run act on that folder unless you say otherwise.",
          "`pwd` stands for **print working directory**. It shows the full address of where you are, like `/Users/student/Documents/columbia`. Read it left to right: start at `/` (the very top of the disk), go into `Users`, then `student`, and so on.",
          "Your **home folder** is `/Users/student`. It's where your Desktop, Documents and Downloads live. Typing `cd` by itself always takes you back there (more on `cd` soon).",
        ],
        examples: [
          { command: "pwd", note: "Print the full path of the folder you're in." },
          { command: "cd", note: "With nothing after it, cd takes you home." },
        ],
        seed: {
          "Documents/": {
            "columbia/": {
              "readme.txt": "Everything Columbia lives in here. Hi Sam!\n",
            },
          },
        },
        startIn: "Documents/columbia",
        tasks: [
          { text: "Run `pwd` to see where you are right now.", check: (sh) => c.ran(sh, "pwd") },
          {
            text: "Type `cd` on its own to go home, then run `pwd` again.",
            check: (sh) => c.ran(sh, "pwd", (r) => r.cwd === sh.home),
          },
        ],
        hints: [
          "Notice how the prompt shows `~/Documents/columbia`. `pwd` shows the same place as a full path.",
          "After `cd`, the prompt should change to just `~`.",
          "Run `pwd`, then `cd`, then `pwd`.",
        ],
        recap: "`pwd` answers \"where am I?\" with a full path, and `cd` alone always brings you home to `/Users/student`.",
        solution: ["pwd", "cd", "pwd"],
      },
      {
        id: "1-3-looking-around",
        title: "Looking around",
        intro: [
          "`ls` (short for **list**) shows what's inside the folder you're in, like opening a Finder window. Folders are shown in blue.",
          "Files whose names start with a dot, like `.zshrc`, are **hidden**. They're usually settings files, so `ls` skips them to keep things tidy. Add the **flag** `-a` (for **all**) to see them too. A flag is an option that changes how a command behaves.",
          "`ls -l` gives the **long** format: one item per line with extra details like size, date, and a string like `-rw-r--r--`. Those are permissions, and you'll decode them in Module 5. Flags can be combined: `ls -la` does both.",
        ],
        examples: [
          { command: "ls", note: "List the visible files and folders here." },
          { command: "ls -a", note: "Also show hidden dotfiles (plus . for this folder and .. for the one above)." },
          { command: "ls -l Documents", note: "Long format, for a different folder." },
        ],
        seed: {
          "Desktop/": { "screenshot_of_my_schedule.png": "(image)" },
          "Documents/": { "housing_contract.pdf": "(pdf)" },
          "Downloads/": { "syllabus.pdf": "(pdf)" },
          "Music/": { "espresso.mp3": "(audio)" },
          "welcome.txt": "Welcome to Terminal Academy, Sam!\n",
          ".zshrc": "# zsh settings live here\n",
          ".secret_playlist.txt": "songs I would never admit to liking:\n1. Cotton Eye Joe\n",
        },
        tasks: [
          { text: "Run `ls` to list your home folder.", check: (sh) => c.ran(sh, "ls") },
          {
            text: "Use `ls -a` to reveal the hidden files.",
            check: (sh) => c.ran(sh, "ls", (r) => c.hasFlag(r, "a") && r.stdout.includes(".secret_playlist.txt")),
          },
          { text: "Use `ls -l` to see the long format.", check: (sh) => c.ran(sh, "ls", (r) => c.hasFlag(r, "l")) },
        ],
        hints: [
          "Flags go after the command, separated by a space: `ls -a`.",
          "Spot the file that starts with a dot once you run `ls -a`. Someone has a secret playlist.",
          "Run `ls`, then `ls -a`, then `ls -l`.",
        ],
        recap: "`ls` lists a folder, `-a` shows hidden dotfiles, and `-l` shows the details. You'll use `ls` constantly.",
        solution: ["ls", "ls -a", "ls -l"],
      },
      {
        id: "1-4-moving-around",
        title: "Moving around",
        intro: [
          "`cd` means **change directory**. `cd Documents` steps into the `Documents` folder inside the one you're in. That's a **relative path**: it's relative to where you're standing, like saying \"the room on the left.\"",
          "An **absolute path** starts with `/` and works from anywhere, like a full street address: `cd /tmp` goes to `/tmp` no matter where you are. You can also hop several folders at once: `cd Documents/columbia`.",
          "Two shortcuts you'll use daily: `..` means **the folder above this one**, so `cd ..` goes up a level. And `cd` alone, or `cd ~`, takes you straight home. Watch the prompt change as you move.",
        ],
        examples: [
          { command: "cd Documents", note: "Relative: go into Documents from where you are." },
          { command: "cd ..", note: "Go up one level." },
          { command: "cd /tmp", note: "Absolute: starts with /, works from anywhere." },
          { command: "cd ~", note: "Go home. Plain `cd` does the same." },
        ],
        seed: {
          "Documents/": {
            "columbia/": {
              "classes/": {
                "coms1004/": { "hw1.txt": "Write a program that prints hello world.\n" },
                "lit_hum/": { "odyssey_notes.txt": "Odysseus: a man of many turns.\n" },
              },
              "dorm/": {
                "roommate_agreement.txt": "Quiet hours after midnight. No fish in the microwave.\n",
                "carlton_arms_floor_plan.txt": "Room 612: two beds, one window, zero closet space.\n",
              },
            },
          },
          "Downloads/": {},
        },
        tasks: [
          {
            text: "Walk into `Documents`, then `columbia`, then `dorm`.",
            check: (sh) => visited(sh, "Documents/columbia/dorm"),
          },
          {
            text: "Use `cd ..` to go back up one level.",
            check: (sh) => c.ran(sh, "cd", (r) => (r.args[0] ?? "").startsWith("..")),
          },
          {
            text: "Jump to `/tmp` using an absolute path, then come home with `cd` or `cd ~`.",
            check: (sh) => visited(sh, "/tmp") && c.cwdIs(sh, "~"),
          },
        ],
        hints: [
          "Use `ls` whenever you're unsure what folders are in front of you.",
          "You can go one step at a time (`cd Documents`, `cd columbia`, `cd dorm`) or all at once (`cd Documents/columbia/dorm`).",
          "Try: `cd Documents/columbia/dorm`, then `cd ..`, then `cd /tmp`, then `cd ~`.",
        ],
        recap: "`cd folder` moves you in, `cd ..` moves you up, `cd /absolute/path` works from anywhere, and `cd` takes you home.",
        solution: ["cd Documents", "cd columbia", "cd dorm", "cd ..", "cd /tmp", "cd ~"],
      },
      {
        id: "1-5-reading-files",
        title: "Reading files",
        intro: [
          "You don't need to open an app to read a text file. `cat` (short for con**cat**enate) prints a whole file right into the terminal. Perfect for short files.",
          "For long files, printing everything is overwhelming. `head` shows just the **first** 10 lines and `tail` shows the **last** 10. Add `-n 3` to pick how many: `head -n 3 file.txt`.",
          "`tail` is a real-world favorite: developers use it to check the newest lines at the bottom of log files. You'll use it for the end of your lecture notes, which is where the homework reminder always is.",
        ],
        examples: [
          { command: "cat grocery_list.txt", note: "Print the whole file." },
          { command: "head -n 3 playlist.txt", note: "Just the first 3 lines." },
          { command: "tail lit_hum_notes.txt", note: "The last 10 lines." },
        ],
        seed: {
          "grocery_list.txt": GROCERY_LIST,
          "playlist.txt": PLAYLIST,
          "lit_hum_notes.txt": `${LIT_HUM_NOTES}Office hours moved to Wednesday, Hamilton 302\n`,
        },
        tasks: [
          {
            text: "Print `grocery_list.txt` with `cat`.",
            check: (sh) => c.ran(sh, "cat", (r) => r.stdout.includes("Frozen dumplings")),
          },
          {
            text: "Show only the first 3 songs in `playlist.txt` with `head`.",
            check: (sh) =>
              c.ran(sh, "head", (r) => nonEmptyLines(r.stdout).length === 3 && r.stdout.includes("Good Luck, Babe!")),
          },
          {
            text: "Show the end of `lit_hum_notes.txt` with `tail`.",
            check: (sh) => c.ran(sh, "tail", (r) => r.stdout.includes("Office hours moved to Wednesday")),
          },
        ],
        hints: [
          "Each command takes the file name after it, separated by a space.",
          "For head, add `-n 3` before the file name to get exactly 3 lines.",
          "Run `cat grocery_list.txt`, `head -n 3 playlist.txt`, then `tail lit_hum_notes.txt`.",
        ],
        recap: "`cat` prints a whole file, `head` the beginning, `tail` the end. Use `-n` to choose how many lines.",
        solution: ["cat grocery_list.txt", "head -n 3 playlist.txt", "tail lit_hum_notes.txt"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 2,
    title: "Files & Folders",
    summary: "Create, copy, move, rename and delete files, and handle lots of them at once with wildcards.",
    free: false,
    lessons: [
      {
        id: "2-1-making-things",
        title: "Making things",
        intro: [
          "`mkdir` (**make directory**) creates a folder: `mkdir projects`. If you want a folder inside a folder that doesn't exist yet, add `-p` (for **parents**) and it builds the whole chain in one go: `mkdir -p projects/website/images`.",
          "`touch` creates an empty file: `touch index.html`. (If the file already exists, it just updates its timestamp, which is harmless.)",
          "To create a file **with text in it**, use `echo` and `>`. `echo` prints text, and `>` sends that text into a file instead of the screen: `echo \"call mom\" > todo.txt`. Careful: `>` replaces whatever was in the file. Wrap your text in quotes so spaces and punctuation stay together.",
        ],
        examples: [
          { command: "mkdir -p projects/website/images", note: "Create three nested folders at once." },
          { command: "touch projects/website/index.html", note: "Create an empty file." },
          { command: "echo \"tap into OMNY on the 1 train\" > todo.txt", note: "Create a file with one line of text." },
        ],
        seed: {
          "Documents/": { "fall_schedule.txt": "COMS 1004 MW 10:10\nLit Hum TR 12:10\nEcon 1105 MW 2:40\n" },
        },
        tasks: [
          {
            text: "Create the folders `projects/website/images` with a single `mkdir -p`.",
            check: (sh) => c.isDir(sh, "projects/website/images"),
          },
          {
            text: "Create an empty file `projects/website/index.html` with `touch`.",
            check: (sh) => c.isFile(sh, "projects/website/index.html"),
          },
          {
            text: "Write a to-do into `todo.txt` in your home folder using `echo` and `>`.",
            check: (sh) => (c.content(sh, "todo.txt") ?? "").trim() !== "",
          },
        ],
        hints: [
          "Without `-p`, `mkdir projects/website/images` fails because `projects` doesn't exist yet.",
          "`touch` takes a path, so you can create a file inside a folder without `cd`-ing into it.",
          "Run `mkdir -p projects/website/images`, `touch projects/website/index.html`, then `echo \"do laundry\" > todo.txt`.",
        ],
        recap: "`mkdir -p` builds folders, `touch` makes empty files, and `echo \"text\" > file` writes a file with something in it.",
        solution: [
          "mkdir -p projects/website/images",
          "touch projects/website/index.html",
          "echo \"buy a desk lamp from Target on 1st Ave\" > todo.txt",
        ],
      },
      {
        id: "2-2-copying-and-moving",
        title: "Copying and moving",
        intro: [
          "`cp` copies: `cp source destination`. `cp essay.txt essay_backup.txt` makes a second file with the same contents. To copy a **folder** and everything inside it, add `-r` (for **recursive**): `cp -r photos photos_backup`.",
          "`mv` moves: `mv Downloads/syllabus.pdf Documents/` picks the file up and puts it in `Documents`. The original is gone from `Downloads`.",
          "Here's the twist: the terminal has no separate rename command. **Renaming is just moving to a new name** in the same folder: `mv untitled.txt dining_rankings.txt`. One heads up: if the destination name already exists, `cp` and `mv` overwrite it without asking.",
        ],
        examples: [
          { command: "cp essay.txt essay_backup.txt", note: "Copy a file." },
          { command: "cp -r photos photos_backup", note: "Copy a folder and everything in it." },
          { command: "mv Downloads/syllabus.pdf Documents/", note: "Move a file into a folder." },
          { command: "mv untitled.txt dining_rankings.txt", note: "Rename a file." },
        ],
        seed: {
          "essay.txt": "Why I chose Columbia: the Midwest is great but I needed a bodega within 30 feet of my bed.\n",
          "untitled.txt": "1. JJ's Place (late night, unbeatable)\n2. John Jay\n3. Ferris\n",
          "photos/": {
            "low_steps.jpg": "(image)",
            "bodega_cat.jpg": "(image)",
            "first_snow.jpg": "(image)",
          },
          "Downloads/": { "syllabus.pdf": "(pdf)" },
          "Documents/": {},
        },
        tasks: [
          {
            text: "Back up `essay.txt` as `essay_backup.txt`.",
            check: (sh) => c.isFile(sh, "essay.txt") && c.content(sh, "essay_backup.txt") === c.content(sh, "essay.txt"),
          },
          {
            text: "Copy the whole `photos` folder to `photos_backup`.",
            check: (sh) =>
              c.isDir(sh, "photos") &&
              c.isDir(sh, "photos_backup") &&
              c.children(sh, "photos_backup").join("/") === c.children(sh, "photos").join("/"),
          },
          {
            text: "Move `Downloads/syllabus.pdf` into `Documents`, and rename `untitled.txt` to `dining_rankings.txt`.",
            check: (sh) =>
              c.isFile(sh, "Documents/syllabus.pdf") &&
              !c.exists(sh, "Downloads/syllabus.pdf") &&
              c.isFile(sh, "dining_rankings.txt") &&
              !c.exists(sh, "untitled.txt"),
          },
        ],
        hints: [
          "The order is always `command source destination`.",
          "Copying a folder without `-r` gives `cp: photos is a directory (not copied).`",
          "Run `cp essay.txt essay_backup.txt`, `cp -r photos photos_backup`, `mv Downloads/syllabus.pdf Documents/`, and `mv untitled.txt dining_rankings.txt`.",
        ],
        recap: "`cp` copies (`-r` for folders), and `mv` both moves and renames. Both overwrite an existing destination silently.",
        solution: [
          "cp essay.txt essay_backup.txt",
          "cp -r photos photos_backup",
          "mv Downloads/syllabus.pdf Documents/",
          "mv untitled.txt dining_rankings.txt",
        ],
      },
      {
        id: "2-3-deleting",
        title: "Deleting",
        intro: [
          "**Read this twice: the terminal has no Trash.** When you delete something with `rm`, it's gone right away. No undo, no \"are you sure?\". Take a breath and double-check the name before you press Enter.",
          "`rm file.txt` removes a file. `rmdir folder` removes a folder, but only if it's empty, which makes it a nice safe option. To remove a folder **and everything inside it**, use `rm -r folder`.",
          "You'll see `rm -rf` online. The `-f` means \"force, don't complain.\" It's powerful and occasionally necessary, but it's also how people accidentally delete their whole project. Only use it when you're 100% sure what the path points to.",
        ],
        examples: [
          { command: "rm old_notes.txt", note: "Delete one file. Permanently." },
          { command: "rmdir empty_box", note: "Delete an empty folder." },
          { command: "rm -r junk", note: "Delete a folder and everything in it." },
        ],
        seed: {
          "old_notes.txt": "notes from orientation week: find the free food\n",
          "important_essay.txt": "My Lit Hum response paper. DO NOT DELETE.\n",
          "empty_box/": {},
          "junk/": {
            "spam_flyer.txt": "Join our a cappella group!!\n",
            "duplicate_IMG_0001.jpg": "(image)",
            "random_screenshot.png": "(image)",
          },
        },
        tasks: [
          { text: "Delete `old_notes.txt`.", check: (sh) => !c.exists(sh, "old_notes.txt") },
          { text: "Remove the empty folder `empty_box`.", check: (sh) => !c.exists(sh, "empty_box") },
          {
            text: "Remove the `junk` folder and everything inside it, but keep `important_essay.txt`.",
            check: (sh) => !c.exists(sh, "junk") && c.isFile(sh, "important_essay.txt"),
          },
        ],
        hints: [
          "Run `ls` first so you know exactly what's there.",
          "`rm junk` alone gives `rm: junk: is a directory`. Folders with stuff in them need `-r`.",
          "Run `rm old_notes.txt`, `rmdir empty_box`, then `rm -r junk`.",
        ],
        recap: "`rm` deletes files, `rmdir` deletes empty folders, and `rm -r` deletes whole folders. There's no Trash, so always check before Enter.",
        solution: ["rm old_notes.txt", "rmdir empty_box", "rm -r junk"],
      },
      {
        id: "2-4-wildcards",
        title: "Wildcards",
        intro: [
          "Your Downloads folder is a mess. Instead of typing every file name, use **wildcards**. `*` matches **any number of characters**, so `*.jpg` means \"every name ending in .jpg.\"",
          "`?` matches **exactly one character**. `notes?.txt` matches `notes1.txt` and `notes2.txt`, but not `notes12.txt`, because `12` is two characters.",
          "The shell expands the wildcard **before** the command runs, so `rm *.png` is the same as typing every `.png` name yourself. Tip: run `ls *.png` first to preview exactly what will be hit. If nothing matches, zsh stops and says `zsh: no matches found`.",
        ],
        examples: [
          { command: "ls *.jpg", note: "Preview every .jpg in this folder." },
          { command: "mv *.jpg ~/Pictures", note: "Move them all at once." },
          { command: "ls notes?.txt", note: "Only notes with a single character after 'notes'." },
        ],
        seed: {
          "Downloads/": {
            "IMG_4021.jpg": "(image)",
            "IMG_4022.jpg": "(image)",
            "IMG_4023.jpg": "(image)",
            "Screenshot1.png": "(image)",
            "Screenshot2.png": "(image)",
            "Screenshot3.png": "(image)",
            "notes1.txt": "econ notes\n",
            "notes2.txt": "lit hum notes\n",
            "notes3.txt": "coms notes\n",
            "notes12.txt": "random notes from week 12\n",
            "syllabus.pdf": "(pdf)",
          },
          "Pictures/": {},
        },
        startIn: "Downloads",
        tasks: [
          {
            text: "Move every `.jpg` into `~/Pictures` with one `mv` command.",
            check: (sh) =>
              !c.children(sh, "Downloads").some((n) => n.endsWith(".jpg")) &&
              c.children(sh, "Pictures").filter((n) => n.endsWith(".jpg")).length === 3 &&
              c.ran(sh, "mv", (r) => r.args.length >= 4),
          },
          {
            text: "Delete all three screenshots with one `rm` and a `*`.",
            check: (sh) =>
              !c.children(sh, "Downloads").some((n) => n.startsWith("Screenshot")) &&
              c.isFile(sh, "Downloads/syllabus.pdf") &&
              c.ran(sh, "rm", (r) => r.args.filter((a) => a.includes("Screenshot")).length >= 3),
          },
          {
            text: "List only `notes1.txt` to `notes3.txt` (not `notes12.txt`) using `?`.",
            check: (sh) =>
              c.ran(sh, "ls", (r) => r.line.includes("?") && r.args.includes("notes1.txt") && !r.args.includes("notes12.txt")),
          },
        ],
        hints: [
          "You're in `Downloads`. `~/Pictures` is an absolute-style path that works from anywhere.",
          "Screenshots all start with `Screenshot`, so `Screenshot*` matches them all.",
          "Run `mv *.jpg ~/Pictures`, `rm Screenshot*.png`, then `ls notes?.txt`.",
        ],
        recap: "`*` matches anything and `?` matches exactly one character. Preview with `ls` before you `rm` with a wildcard.",
        solution: ["mv *.jpg ~/Pictures", "rm Screenshot*.png", "ls notes?.txt"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 3,
    title: "Finding Things",
    summary: "Search inside files with grep, find files by name with find, and count and sort with wc, sort and uniq.",
    free: false,
    lessons: [
      {
        id: "3-1-grep",
        title: "Searching inside files with grep",
        intro: [
          "`grep` searches **inside** files and prints every line that matches. `grep pizza group_chat.txt` shows each line that mentions pizza. It's Cmd+F for your whole computer.",
          "grep is case-sensitive, so `Butler` won't match `butler`. Flags fix that: `-i` ignores case, `-n` adds line numbers, and `-c` just **counts** the matching lines instead of printing them.",
          "`-r` (recursive) searches every file inside a folder, and grep shows which file each match came from. Combine flags freely: `grep -rn midterm notes` searches the `notes` folder and shows line numbers. If grep finds nothing, it prints nothing.",
        ],
        examples: [
          { command: "grep pizza group_chat.txt", note: "Lines that contain 'pizza'." },
          { command: "grep -i butler group_chat.txt", note: "Ignore upper/lower case." },
          { command: "grep -c lol group_chat.txt", note: "Just count the matching lines." },
          { command: "grep -rn midterm notes", note: "Search every file in notes, with line numbers." },
        ],
        seed: {
          "group_chat.txt": GROUP_CHAT,
          "notes/": {
            "coms1004.txt": "Week 5: recursion\nPractice problems on CourseWorks\nThe midterm covers weeks 1-6\nBring a pencil, no laptops\n",
            "lit_hum.txt": "The Odyssey, books 9-12\nNo midterm, just a response paper\nSeminar on Thursday\n",
            "econ1105.txt": "Supply and demand, again\nMidterm review session Sunday in Lerner\nThe midterm is closed-book\n",
          },
        },
        tasks: [
          {
            text: "Find every line in `group_chat.txt` that mentions butler, ignoring case.",
            check: (sh) =>
              c.ran(sh, "grep", (r) => c.hasFlag(r, "i") && r.stdout.includes("butler") && r.stdout.includes("BUTLER")),
          },
          {
            text: "Count how many lines in `group_chat.txt` contain `lol` using `-c`.",
            check: (sh) =>
              c.ran(sh, "grep", (r) => c.hasFlag(r, "c") && r.args.some((a) => /lol/i.test(a)) && /^\d+$/.test(r.stdout.trim())),
          },
          {
            text: "Search every file in `notes` for `midterm`, with line numbers, using `-r` and `-n`.",
            check: (sh) =>
              c.ran(sh, "grep", (r) => c.hasFlag(r, "r") && c.hasFlag(r, "n") && r.stdout.includes("coms1004.txt:3:")),
          },
        ],
        hints: [
          "The pattern goes first, then the file: `grep pattern file`.",
          "Flags go right after `grep`. You can write `-r -n` or squash them together as `-rn`.",
          "Run `grep -i butler group_chat.txt`, `grep -c lol group_chat.txt`, then `grep -rn midterm notes`.",
        ],
        recap: "grep finds lines inside files. `-i` ignores case, `-n` numbers lines, `-c` counts, and `-r` searches whole folders.",
        solution: ["grep -i butler group_chat.txt", "grep -c lol group_chat.txt", "grep -rn midterm notes"],
      },
      {
        id: "3-2-find",
        title: "Finding files with find",
        intro: [
          "grep looks **inside** files. `find` looks for the files **themselves**, by name or type, digging through every folder underneath where you point it. It's how you track down that PDF you downloaded three weeks ago.",
          "`find . -name bodega_cat.jpg` searches from `.` (the folder you're in) for that exact name and prints the path. Use wildcards for patterns, but **put them in quotes**: `find . -name \"*.pdf\"`. Without quotes, zsh tries to expand `*.pdf` itself, and if there's no PDF right here you get `zsh: no matches found`.",
          "`-type f` limits results to files and `-type d` to directories (folders). `-iname` is like `-name` but ignores case.",
        ],
        examples: [
          { command: "find . -name bodega_cat.jpg", note: "Where is this file?" },
          { command: "find . -name \"*.pdf\"", note: "Every PDF, anywhere below here. Note the quotes." },
          { command: "find Documents -type d", note: "Only the folders inside Documents." },
        ],
        seed: {
          "Documents/": {
            "columbia/": {
              "fall/": {
                "coms1004/": { "syllabus.pdf": "(pdf)", "hw1.pdf": "(pdf)" },
                "lit_hum/": { "iliad_notes.txt": "Rage, goddess, sing the rage of Achilles\n" },
              },
              "spring/": {
                "econ1105/": { "problem_set_1.pdf": "(pdf)" },
              },
            },
          },
          "Pictures/": {
            "nyc/": { "bodega_cat.jpg": "(image)", "skyline_from_low.jpg": "(image)" },
          },
          "Downloads/": { "metrocard_receipt.pdf": "(pdf)" },
        },
        tasks: [
          {
            text: "Use `find` with `-name` to discover where `bodega_cat.jpg` is hiding.",
            check: (sh) =>
              c.ran(sh, "find", (r) => r.args.some((a) => a === "-name" || a === "-iname") && r.stdout.includes("nyc/bodega_cat.jpg")),
          },
          {
            text: "List every `.pdf` file anywhere in your home folder.",
            check: (sh) =>
              c.ran(
                sh,
                "find",
                (r) =>
                  r.args.some((a) => /pdf/i.test(a) && a.includes("*")) &&
                  r.stdout.includes("hw1.pdf") &&
                  r.stdout.includes("metrocard_receipt.pdf"),
              ),
          },
          {
            text: "List only the folders inside `Documents` with `-type d`.",
            check: (sh) =>
              c.ran(sh, "find", (r) => r.args.join(" ").includes("-type d") && r.stdout.includes("econ1105") && !r.stdout.includes(".pdf")),
          },
        ],
        hints: [
          "The shape is `find where -name what`. Use `.` for \"right here\".",
          "Quote wildcard patterns: `\"*.pdf\"`.",
          "Run `find . -name bodega_cat.jpg`, `find . -name \"*.pdf\"`, then `find Documents -type d`.",
        ],
        recap: "`find` searches for files by `-name` (quote your wildcards!) or `-type f`/`-type d`, through every folder below a starting point.",
        solution: ["find . -name bodega_cat.jpg", "find . -name \"*.pdf\"", "find Documents -type d"],
      },
      {
        id: "3-3-counting-and-sorting",
        title: "Counting and sorting",
        intro: [
          "`wc` means **word count**. `wc -l file` counts **lines**, which is often what you actually want: how many songs, how many votes, how many errors.",
          "`sort` prints a file's lines in order. `-r` reverses it, and `-n` sorts numbers by value (so 9 comes before 10). The file itself isn't changed; you just see a sorted view.",
          "`uniq -c` squashes **neighboring** duplicate lines into one and counts them. Because it only looks at neighbors, you sort first and send the result into uniq with a pipe, `|`: `sort votes.txt | uniq -c`. That's a sneak peek at Module 4.",
        ],
        examples: [
          { command: "wc -l playlist.txt", note: "How many lines (songs)?" },
          { command: "sort playlist.txt", note: "Alphabetical order." },
          { command: "sort dining_votes.txt | uniq -c", note: "Sort, then count each distinct line." },
        ],
        seed: {
          "playlist.txt": PLAYLIST,
          "dining_votes.txt": DINING_VOTES,
        },
        tasks: [
          {
            text: "Count the songs in `playlist.txt` with `wc -l`.",
            check: (sh) => c.ran(sh, "wc", (r) => c.hasFlag(r, "l") && /\b12\b/.test(r.stdout)),
          },
          {
            text: "Print `playlist.txt` in alphabetical order with `sort`.",
            check: (sh) => c.ran(sh, "sort", (r) => nonEmptyLines(r.stdout)[0] === "Bags - Clairo"),
          },
          {
            text: "Tally `dining_votes.txt`: `sort` it, then pipe it into `uniq -c`.",
            check: (sh) =>
              c.ran(sh, "uniq", (r) => c.hasFlag(r, "c") && /^\s*5 JJ's Place$/m.test(r.stdout) && /^\s*4 John Jay$/m.test(r.stdout)),
          },
        ],
        hints: [
          "`wc -l` prints the number of lines followed by the file name.",
          "If uniq's counts look too small, you forgot to sort first: uniq only merges duplicates that sit next to each other.",
          "Run `wc -l playlist.txt`, `sort playlist.txt`, then `sort dining_votes.txt | uniq -c`.",
        ],
        recap: "`wc -l` counts lines, `sort` orders them, and `sort | uniq -c` tallies how often each line appears.",
        solution: ["wc -l playlist.txt", "sort playlist.txt", "sort dining_votes.txt | uniq -c"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 4,
    title: "Pipes & Redirection",
    summary: "Connect commands with pipes, save output to files, chain commands, and get help.",
    free: false,
    lessons: [
      {
        id: "4-1-pipes",
        title: "Pipes",
        intro: [
          "Each command does one small job well. The **pipe**, `|`, connects them: the output of the command on the left becomes the input of the command on the right. It's the single most powerful idea in the terminal.",
          "`cat group_chat.txt | grep pizza` sends the chat into grep, which keeps only the pizza lines. `ls Music | wc -l` lists your songs and counts the lines, telling you how many there are.",
          "You can chain as many as you like and read them left to right like a sentence: \"sort the steps numerically in reverse, then show the top 3\" is `sort -nr steps.txt | head -n 3`.",
        ],
        examples: [
          { command: "cat group_chat.txt | grep pizza", note: "Filter the chat down to the pizza talk." },
          { command: "ls Music | wc -l", note: "How many files are in Music?" },
          { command: "sort -nr steps.txt | head -n 3", note: "Biggest numbers first, keep the top 3." },
        ],
        seed: {
          "group_chat.txt": GROUP_CHAT,
          "steps.txt": STEPS,
          "Music/": MUSIC,
        },
        tasks: [
          {
            text: "Pipe `cat group_chat.txt` into `grep` to find the pizza talk.",
            check: (sh) => c.ran(sh, "grep", (r) => r.piped && /pizza/i.test(r.stdout)),
          },
          {
            text: "Count the files in `Music` by piping `ls` into `wc -l`.",
            check: (sh) => c.ran(sh, "wc", (r) => r.piped && c.hasFlag(r, "l") && r.stdout.trim() === "7"),
          },
          {
            text: "Show your 3 biggest step days: `sort` `steps.txt` from highest to lowest, then pipe it into `head`.",
            check: (sh) =>
              c.ran(sh, "head", (r) => r.piped && nonEmptyLines(r.stdout).length === 3 && nonEmptyLines(r.stdout)[0] === "21877 Thursday"),
          },
        ],
        hints: [
          "The pipe character `|` is Shift + backslash, above the Enter key.",
          "For the steps, `sort -n` sorts by number and `-r` flips it so the biggest is first. Combine them as `-nr`.",
          "Run `cat group_chat.txt | grep pizza`, `ls Music | wc -l`, then `sort -nr steps.txt | head -n 3`.",
        ],
        recap: "`|` feeds one command's output into the next. Small commands, chained together, answer big questions.",
        solution: ["cat group_chat.txt | grep pizza", "ls Music | wc -l", "sort -nr steps.txt | head -n 3"],
      },
      {
        id: "4-2-redirection",
        title: "Redirection",
        intro: [
          "Normally output goes to the screen. **Redirection** sends it into a file instead. You've already met `>`: `ls Music > songs.txt` saves the list of songs into `songs.txt`. Nothing shows on screen because it all went into the file.",
          "`>` **overwrites**: if the file existed, its old contents are wiped first. `>>` **appends**: it adds to the end and keeps what was there. Use `>>` for logs and journals, and `>` when you want a fresh start.",
          "Mixing them up is a classic mistake. `echo \"day 2\" > journal.txt` would erase day 1. When in doubt, use `>>`, then `cat` the file to check.",
        ],
        examples: [
          { command: "ls Music > songs.txt", note: "Save output to a file (overwrites)." },
          { command: "echo \"Oct 9: saw a rat carry a whole bagel\" >> journal.txt", note: "Add a line to the end." },
          { command: "cat journal.txt", note: "Check the result." },
        ],
        seed: {
          "Music/": MUSIC,
          "journal.txt": "Sep 2: first day of classes, got lost in Hamilton\nSep 3: found the good bathroom in Butler\n",
          "scratch.txt": "OLD brainstorm line 1\nOLD brainstorm line 2\nOLD brainstorm line 3\n",
        },
        tasks: [
          {
            text: "Save the list of files in `Music` into a new file `songs.txt`.",
            check: (sh) => c.fileIncludes(sh, "songs.txt", "espresso.mp3"),
          },
          {
            text: "Add a new line to the end of `journal.txt` without erasing what's there.",
            check: (sh) => {
              const ls = c.fileLines(sh, "journal.txt");
              return ls.length >= 3 && ls[0].startsWith("Sep 2:") && ls[1].startsWith("Sep 3:");
            },
          },
          {
            text: "Replace everything in `scratch.txt` with a single new line using `>`.",
            check: (sh) => {
              const ls = c.fileLines(sh, "scratch.txt");
              return ls.length === 1 && ls[0].trim() !== "" && !ls[0].includes("OLD");
            },
          },
        ],
        hints: [
          "Any command's output can be redirected: `command > file`.",
          "Two arrows (`>>`) add; one arrow (`>`) replaces.",
          "Run `ls Music > songs.txt`, `echo \"Oct 9: first bacon egg and cheese\" >> journal.txt`, then `echo \"fresh start\" > scratch.txt`.",
        ],
        recap: "`>` writes output to a file, replacing it; `>>` adds to the end. Your terminal output can now be saved, not just seen.",
        solution: [
          "ls Music > songs.txt",
          "echo \"Oct 9: first bacon egg and cheese from the bodega\" >> journal.txt",
          "echo \"new idea: start a club for Midwesterners who miss Culver's\" > scratch.txt",
        ],
      },
      {
        id: "4-3-chaining-and-help",
        title: "Chaining and getting help",
        intro: [
          "You can run several commands on one line. `;` runs them one after another no matter what. `&&` runs the next one **only if the previous one succeeded**, which is safer: `mkdir weekend_plans && cd weekend_plans` won't try to `cd` if the folder couldn't be made.",
          "`history` lists the commands you've typed, numbered. It's great for \"wait, what did I just do?\" On a real Mac, you can also press the up arrow to bring back earlier commands.",
          "When you forget how a command works, `man` (for **manual**) shows its documentation: `man grep`. On a real Mac, press `q` to leave the manual. Nobody memorizes every flag. Looking things up is the job.",
        ],
        examples: [
          { command: "mkdir weekend_plans && cd weekend_plans", note: "Second command runs only if the first worked." },
          { command: "cd ~; ls", note: "Run one, then the other, regardless." },
          { command: "history", note: "See what you've typed." },
          { command: "man ls", note: "Read the manual for ls." },
        ],
        seed: {
          "ideas.txt": "weekend: Little Island, Smorgasburg, or just sleep\n",
        },
        tasks: [
          {
            text: "In one line, make a folder `weekend_plans` and `cd` into it, joined with `&&`.",
            check: (sh) =>
              c.isDir(sh, "weekend_plans") &&
              sh.log.some((r) => r.name === "cd" && r.exit === 0 && r.line.includes("&&")) &&
              visited(sh, "weekend_plans"),
          },
          { text: "Look back at what you've typed with `history`.", check: (sh) => c.ran(sh, "history") },
          {
            text: "Open the manual page for `grep` with `man`.",
            check: (sh) => c.ran(sh, "man", (r) => r.args[0] === "grep"),
          },
        ],
        hints: [
          "`&&` goes between the two commands: `first && second`.",
          "`man` takes the name of the command you want to read about.",
          "Run `mkdir weekend_plans && cd weekend_plans`, then `history`, then `man grep`.",
        ],
        recap: "`&&` chains commands safely, `;` chains them no matter what, `history` shows your past, and `man` is your built-in manual.",
        solution: ["mkdir weekend_plans && cd weekend_plans", "history", "man grep"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 5,
    title: "Permissions",
    summary: "Read permission strings, change them with chmod, and understand what sudo really does.",
    free: false,
    lessons: [
      {
        id: "5-1-reading-permissions",
        title: "Reading ls -l",
        intro: [
          "Run `ls -l` and each line starts with something like `-rw-r--r--`. That's 10 characters. The **first** tells you what it is: `-` for a file, `d` for a directory (folder).",
          "The other nine are three groups of three: what the **user** (the owner, you) can do, what the **group** can do, and what **others** (everyone else) can do. In each group, `r` = read, `w` = write (change), `x` = execute (run as a program, or for folders, open them). A `-` means \"not allowed.\"",
          "So `-rw-r--r--` is a file you can read and edit, and everyone else can only read. `drwxr-xr-x` is a folder you fully control and others can look inside. The `student  staff` part after it is the owner and the group.",
        ],
        examples: [
          { command: "ls -l mystery", note: "Long listing of the mystery folder." },
          { command: "ls -la", note: "Long listing including hidden files." },
        ],
        seed: {
          "mystery/": {
            alpha: "Nope, this is a file. Look for the d.\n",
            "beta/": { "note.txt": "You found it! The free bagels are in the Lerner lobby at 3pm.\n" },
            gamma: "Also just a file. So close.\n",
          },
        },
        tasks: [
          {
            text: "Run `ls -l` on the `mystery` folder.",
            check: (sh) => c.ran(sh, "ls", (r) => c.hasFlag(r, "l") && r.stdout.includes("alpha") && r.stdout.includes("gamma")),
          },
          {
            text: "Using the first character of each line, `cd` into the only folder inside `mystery`.",
            check: (sh) => visited(sh, "mystery/beta"),
          },
          {
            text: "Read the note you find inside it.",
            check: (sh) => c.printed(sh, "free bagels"),
          },
        ],
        hints: [
          "Look for the line that starts with `d`.",
          "The names have no extensions on purpose. The permission string is the only giveaway.",
          "Run `ls -l mystery`, then `cd mystery/beta`, then `cat note.txt`.",
        ],
        recap: "The first character says file (`-`) or folder (`d`), and the next nine say who can read, write and execute.",
        solution: ["ls -l mystery", "cd mystery/beta", "cat note.txt"],
      },
      {
        id: "5-2-chmod",
        title: "Changing permissions with chmod",
        intro: [
          "`chmod` (**change mode**) changes permissions. The friendly way uses letters: `chmod +x backup.sh` adds execute permission so the file can run as a program. `chmod go-w file` takes write away from group and others.",
          "The numeric way is shorter once you know the trick: r = 4, w = 2, x = 1, and you add them up for each of user/group/other. `7` = rwx, `6` = rw-, `5` = r-x, `4` = r--, `0` = nothing.",
          "The three you'll see everywhere: `755` (rwxr-xr-x) for programs and folders, `644` (rw-r--r--) for normal files, and `600` (rw-------) for private stuff only you should read, like SSH keys or a diary.",
        ],
        examples: [
          { command: "chmod +x scripts/backup.sh", note: "Make a file executable." },
          { command: "chmod 600 diary.txt", note: "Only you can read or write it." },
          { command: "chmod 755 scripts/deploy.sh", note: "rwxr-xr-x: you do everything, others can read and run." },
          { command: "ls -l scripts", note: "Check your work." },
        ],
        seed: {
          "diary.txt": "Oct 3: I think I have a crush on my CC discussion partner. Nobody can know.\n",
          "scripts/": {
            "backup.sh": "#!/bin/zsh\ncp -r ~/Documents ~/Documents_backup\necho \"Backed up!\"\n",
            "deploy.sh": "#!/bin/zsh\necho \"Deploying Sam's portfolio site...\"\n",
          },
        },
        tasks: [
          { text: "Make `scripts/backup.sh` executable with `chmod +x`.", check: (sh) => c.isExecutable(sh, "scripts/backup.sh") },
          { text: "Lock down `diary.txt` so only you can read and write it (`600`).", check: (sh) => c.modeIs(sh, "diary.txt", 0o600) },
          { text: "Set `scripts/deploy.sh` to exactly `755` using numbers.", check: (sh) => c.modeIs(sh, "scripts/deploy.sh", 0o755) },
        ],
        hints: [
          "The order is `chmod mode file`.",
          "6 = 4 (read) + 2 (write). 600 means rw- for you and nothing for anyone else.",
          "Run `chmod +x scripts/backup.sh`, `chmod 600 diary.txt`, then `chmod 755 scripts/deploy.sh`.",
        ],
        recap: "`chmod +x` makes something runnable; numbers like 755, 644 and 600 set all nine permissions at once.",
        solution: ["chmod +x scripts/backup.sh", "chmod 600 diary.txt", "chmod 755 scripts/deploy.sh", "ls -l scripts"],
      },
      {
        id: "5-3-sudo",
        title: "sudo and the root user",
        intro: [
          "Every Mac has a special user called **root**, the administrator who can do anything to any file. Normally you're not root, which protects you: you can't accidentally break system files.",
          "`sudo` means \"**s**uper**u**ser **do**\": run this one command as root. On a real Mac it asks for your password first (and shows nothing while you type, which is normal). `sudo whoami` prints `root`, proving the command ran as the administrator.",
          "**Be careful with sudo.** It turns off the safety rails. If a tutorial tells you to `sudo` something, understand what it does first, and never paste `sudo rm -rf` anything from the internet. If a command fails with \"Permission denied\", the answer is usually to fix the path or permissions, not to reach for sudo.",
        ],
        examples: [
          { command: "whoami", note: "You, as usual." },
          { command: "sudo whoami", note: "Running as root, the administrator." },
        ],
        seed: {
          "README.txt": "With great power comes great responsibility. - every sysadmin ever\n",
        },
        tasks: [
          {
            text: "Run `whoami` to see your normal username.",
            check: (sh) => c.ran(sh, "whoami", (r) => r.stdout.trim() === sh.user),
          },
          {
            text: "Now run `whoami` with `sudo` in front of it.",
            check: (sh) => c.ran(sh, "sudo", (r) => r.args[0] === "whoami" && r.stdout.trim() === "root"),
          },
        ],
        hints: [
          "`sudo` goes in front of the command you want to run as root.",
          "Compare the two outputs: one is you, one is the administrator.",
          "Run `whoami`, then `sudo whoami`.",
        ],
        recap: "`sudo` runs a single command as root, the all-powerful admin. Use it rarely and only when you understand the command.",
        solution: ["whoami", "sudo whoami"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 6,
    title: "Environment",
    summary: "Variables, the environment, export, and aliases that make the shell yours.",
    free: false,
    lessons: [
      {
        id: "6-1-variables",
        title: "Variables",
        intro: [
          "A **variable** is a name that holds a value. The shell comes with some already set: `$HOME` is your home folder, `$USER` is your username, and `$PATH` is the list of folders the shell searches when you type a command name.",
          "Put a `$` in front of a name to use its value: `echo $HOME` prints `/Users/student`. The shell swaps in the value **before** running the command, so `cd $HOME` works too.",
          "Make your own with `NAME=value`, with **no spaces around the =** (`NAME = value` is an error, because zsh thinks `NAME` is a command). Quote values that have spaces: `FAV_CAT=\"Mango from the 112th St bodega\"`.",
        ],
        examples: [
          { command: "echo $HOME", note: "Your home folder." },
          { command: "echo $PATH", note: "Where the shell looks for commands, separated by colons." },
          { command: "FAV_CAT=\"Mango\"", note: "Create a variable. No spaces around =." },
          { command: "echo \"My favorite bodega cat is $FAV_CAT\"", note: "Use it inside double quotes." },
        ],
        seed: {
          "notes.txt": "variables: like labeled jars\n",
        },
        tasks: [
          {
            text: "Print your home folder with `echo $HOME`.",
            check: (sh) => c.ran(sh, "echo", (r) => /\$\{?HOME\b/.test(r.line) && r.stdout.includes(sh.home)),
          },
          {
            text: "Print your `$PATH`.",
            check: (sh) => c.ran(sh, "echo", (r) => /\$\{?PATH\b/.test(r.line) && r.stdout.includes("/usr/bin")),
          },
          {
            text: "Create a variable `FAV_CAT` holding your favorite bodega cat's name, then `echo` it.",
            check: (sh) => {
              const value = varValue(sh, "FAV_CAT");
              return value.trim() !== "" && c.ran(sh, "echo", (r) => /\$\{?FAV_CAT\b/.test(r.line) && r.stdout.includes(value));
            },
          },
        ],
        hints: [
          "Variable names are case-sensitive: `$HOME`, not `$home`.",
          "When creating a variable, there's no `$` and no spaces: `FAV_CAT=Mango`. When using it, add the `$`.",
          "Run `echo $HOME`, `echo $PATH`, then `FAV_CAT=Mango` and `echo $FAV_CAT`.",
        ],
        recap: "`NAME=value` creates a variable and `$NAME` uses it. `$HOME`, `$USER` and `$PATH` are always there for you.",
        solution: ["echo $HOME", "echo $PATH", "FAV_CAT=\"Mango\"", "echo \"My favorite bodega cat is $FAV_CAT\""],
      },
      {
        id: "6-2-export-and-env",
        title: "export and the environment",
        intro: [
          "A plain `NAME=value` variable lives only in your current shell. Programs you launch from it can't see it. `export` promotes it to an **environment variable**, which gets passed down to every program you run. Tools read settings this way, like `EDITOR` or API keys.",
          "`export MAJOR=\"Computer Science\"` creates and exports in one step. Or export one you already made: `export FAV_CAT`.",
          "`env` (or `printenv`) lists every environment variable. `printenv MAJOR` prints just one. Since `env` prints a lot, pipe it into grep to search: `env | grep student`.",
        ],
        examples: [
          { command: "export MAJOR=\"Computer Science\"", note: "Create an environment variable." },
          { command: "printenv MAJOR", note: "Print just that one." },
          { command: "env", note: "Print all of them." },
          { command: "env | grep student", note: "Search the environment." },
        ],
        seed: {
          "notes.txt": "export = share with programs I run\n",
        },
        tasks: [
          { text: "Use `export` to set `MAJOR` to your (intended!) major.", check: (sh) => c.envIs(sh, "MAJOR") },
          {
            text: "Confirm it's in the environment with `printenv` or `env`.",
            check: (sh) =>
              c.envIs(sh, "MAJOR") &&
              sh.log.some((r) => (r.name === "printenv" || r.name === "env") && r.exit === 0 && r.stdout.includes(sh.env.MAJOR)),
          },
          {
            text: "Pipe `env` into `grep` to find every variable that mentions `student`.",
            check: (sh) => c.ran(sh, "grep", (r) => r.piped && r.stdout.includes("HOME=/Users/student")),
          },
        ],
        hints: [
          "Same rule as before: no spaces around `=`, and quote values with spaces.",
          "`printenv` with a name prints just that variable's value.",
          "Run `export MAJOR=\"Computer Science\"`, `printenv MAJOR`, then `env | grep student`.",
        ],
        recap: "`export` makes a variable visible to programs you run, and `env`/`printenv` show what's in the environment.",
        solution: ["export MAJOR=\"Computer Science\"", "printenv MAJOR", "env | grep student"],
      },
      {
        id: "6-3-aliases",
        title: "Aliases",
        intro: [
          "Typing `ls -la` fifty times a day gets old. An **alias** is a nickname for a command: `alias ll='ls -la'`. Now typing `ll` runs `ls -la`. Use single quotes around the command so the whole thing stays together.",
          "`alias` by itself lists your aliases. `which ll` or `type ll` tells you what a name really is: an alias, a shell built-in, or a program on disk. Handy when a command behaves strangely.",
          "Aliases disappear when you close the terminal. To keep them, people add the alias line to `~/.zshrc`, the hidden settings file zsh reads every time it starts.",
        ],
        examples: [
          { command: "alias ll='ls -la'", note: "Create a shortcut." },
          { command: "ll", note: "Use it." },
          { command: "which ll", note: "What is ll, really?" },
          { command: "type cd", note: "cd is a shell builtin." },
        ],
        seed: {
          ".zshrc": "# zsh reads this file every time it starts\nexport EDITOR=nano\n",
          "Documents/": { "fall_schedule.txt": "COMS 1004 MW 10:10\n" },
        },
        tasks: [
          {
            text: "Create an alias `ll` that runs `ls -la`.",
            check: (sh) => c.aliasIs(sh, "ll", (v) => /^\s*ls\b/.test(v)),
          },
          {
            text: "Use your new `ll` alias.",
            check: (sh) => c.ran(sh, "ls", (r) => /(^|[;&|]\s*)ll\b/.test(r.line.trim())),
          },
          {
            text: "Check what `ll` is with `which` or `type`.",
            check: (sh) =>
              sh.log.some((r) => (r.name === "which" || r.name === "type") && r.exit === 0 && r.args.includes("ll") && /alias/.test(r.stdout)),
          },
        ],
        hints: [
          "No spaces around `=`, and single quotes around the command: `alias name='command'`.",
          "After creating it, just type `ll` and press Enter.",
          "Run `alias ll='ls -la'`, then `ll`, then `which ll`.",
        ],
        recap: "`alias name='command'` creates a shortcut, and `which`/`type` reveal what any name really runs.",
        solution: ["alias ll='ls -la'", "ll", "which ll"],
      },
    ],
  },

  // ===========================================================================
  {
    id: 7,
    title: "Your First Script",
    summary: "Write a shell script, make it executable, run it, and pass it arguments.",
    free: false,
    lessons: [
      {
        id: "7-1-writing-a-script",
        title: "Writing a script",
        intro: [
          "A **script** is a text file full of commands that run in order, top to bottom. Anything you'd type by hand can go in a script, so a ten-step routine becomes one command.",
          "The first line should be a **shebang**: `#!/bin/zsh`. It tells your Mac which program should run the file. Other lines starting with `#` are comments, notes for humans that the shell skips.",
          "There's no text editor in this practice terminal, so build the file line by line with `echo` and `>>`. Use **single quotes** around each line, so the shell writes it exactly as typed instead of interpreting it: `echo 'echo \"hi\"' >> hello.sh`. Then `chmod +x hello.sh` makes it runnable, and `./hello.sh` runs it. The `./` means \"the file right here in this folder.\"",
        ],
        examples: [
          { command: "echo '#!/bin/zsh' > hello.sh", note: "Start the file with a shebang (> creates it)." },
          { command: "echo 'echo \"Hello from Butler Library\"' >> hello.sh", note: "Append a command." },
          { command: "chmod +x hello.sh", note: "Make it executable." },
          { command: "./hello.sh", note: "Run it." },
        ],
        seed: {
          "scripts/": {},
        },
        startIn: "scripts",
        tasks: [
          {
            text: "Create `hello.sh` whose first line is `#!/bin/zsh`, followed by at least one `echo` line.",
            check: (sh) => {
              const ls = c.fileLines(sh, firstFile(sh, "scripts/hello.sh", "hello.sh"));
              return (ls[0] ?? "").trim().startsWith("#!/bin/") && ls.slice(1).some((l) => /^\s*echo\b/.test(l));
            },
          },
          {
            text: "Make `hello.sh` executable.",
            check: (sh) => c.isExecutable(sh, firstFile(sh, "scripts/hello.sh", "hello.sh")),
          },
          {
            text: "Run it with `./hello.sh`.",
            check: (sh) => sh.log.some((r) => r.exit === 0 && r.name.includes("/") && lastPart(r.name) === "hello.sh" && r.stdout.trim() !== ""),
          },
        ],
        hints: [
          "Use `>` for the first line (creates the file) and `>>` for every line after (appends). `cat hello.sh` shows what you've got.",
          "If `./hello.sh` says `zsh: permission denied`, you still need `chmod +x hello.sh`.",
          "Run `echo '#!/bin/zsh' > hello.sh`, `echo 'echo \"Hello from Butler Library\"' >> hello.sh`, `chmod +x hello.sh`, then `./hello.sh`.",
        ],
        recap: "A script is a file of commands with a `#!/bin/zsh` shebang. `chmod +x` makes it runnable and `./script.sh` runs it.",
        solution: [
          "echo '#!/bin/zsh' > hello.sh",
          "echo 'echo \"Hello from Butler Library\"' >> hello.sh",
          "echo 'echo \"Running on 3 hours of sleep and an iced oat latte\"' >> hello.sh",
          "chmod +x hello.sh",
          "./hello.sh",
        ],
      },
      {
        id: "7-2-arguments-and-variables",
        title: "Arguments and variables",
        intro: [
          "Scripts get much more useful when they take input. Words you type after the script name are **arguments**: in `./greet.sh Maya Jordan`, `Maya` is `$1` and `Jordan` is `$2`. `$#` is how many arguments there were.",
          "Scripts can use variables too. The starter `greet.sh` in your `scripts` folder already sets `CAMPUS=\"Morningside Heights\"` and uses `$CAMPUS`. Take a look with `cat greet.sh`.",
          "Add lines with `echo '...' >> greet.sh`. The single quotes matter: they keep `$1` as literal text in the file, so it gets filled in when the script **runs**, not when you write the line. Then run the script with different arguments and watch the output change.",
        ],
        examples: [
          { command: "cat greet.sh", note: "See the starter script." },
          { command: "echo 'echo \"Hey $1, want to get bagels?\"' >> greet.sh", note: "Add a line that uses the first argument." },
          { command: "./greet.sh Maya", note: "$1 becomes Maya." },
          { command: "./greet.sh Maya Jordan Priya", note: "$# is 3." },
        ],
        seed: {
          "scripts/": {
            "greet.sh": "#!/bin/zsh\n# greet.sh: say hi to a friend\nCAMPUS=\"Morningside Heights\"\necho \"Welcome to $CAMPUS\"\n",
          },
        },
        startIn: "scripts",
        tasks: [
          {
            text: "Add a line to `greet.sh` that greets `$1` by name.",
            check: (sh) => {
              const text = c.content(sh, "scripts/greet.sh") ?? "";
              return text.includes("$1") || text.includes("${1}");
            },
          },
          {
            text: "Run `greet.sh` with two different names, e.g. `./greet.sh Maya` and `./greet.sh Jordan`.",
            check: (sh) => {
              const names = new Set(
                scriptRuns(sh, "greet.sh")
                  .filter((r) => r.args[0] && r.stdout.includes(r.args[0]))
                  .map((r) => r.args[0]),
              );
              return names.size >= 2;
            },
          },
          {
            text: "Add a line that prints `$#`, then run the script with three arguments.",
            check: (sh) =>
              c.fileIncludes(sh, "scripts/greet.sh", "$#") &&
              scriptRuns(sh, "greet.sh").some((r) => r.args.length === 3 && /\b3\b/.test(r.stdout)),
          },
        ],
        hints: [
          "Wrap the whole line in single quotes, and use double quotes inside it: `echo 'echo \"Hi $1\"' >> greet.sh`.",
          "To run it as `./greet.sh`, it needs `chmod +x greet.sh` first. (`sh greet.sh Maya` also works.)",
          "Run `echo 'echo \"Hey $1\"' >> greet.sh`, `chmod +x greet.sh`, `./greet.sh Maya`, `./greet.sh Jordan`, `echo 'echo \"You gave me $# names\"' >> greet.sh`, then `./greet.sh Maya Jordan Priya`.",
        ],
        recap: "`$1`, `$2`... are a script's arguments and `$#` counts them. One script, different inputs, different results. You just wrote a real program.",
        solution: [
          "cat greet.sh",
          "echo 'echo \"Hey $1, want to get bagels on Broadway?\"' >> greet.sh",
          "chmod +x greet.sh",
          "./greet.sh Maya",
          "./greet.sh Jordan",
          "echo 'echo \"You gave me $# names\"' >> greet.sh",
          "./greet.sh Maya Jordan Priya",
        ],
      },
    ],
  },
];

export const LESSONS = MODULES.flatMap((m) => m.lessons);
