import type { CommandConcept } from "./command-content.js";

const effectiveShell = { label: "Effective Shell", url: "https://effective-shell.com/part-2-core-skills/finding-files/" };
const posixFind = { label: "POSIX find", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/find.html" };
const gnuFind = { label: "GNU findutils", url: "https://www.gnu.org/software/findutils/manual/html_mono/find.html" };
const appleFind = { label: "Apple find(1)", url: "https://github.com/apple-oss-distributions/shell_cmds/blob/298787009e5432c5e4c378a077f98267077e3495/find/find.1" };

export const findCommandConcepts: CommandConcept[] = [
  {
    command: "find",
    concept: "traversal-patterns",
    label: "start points, -type, and quoted -name",
    platform: "POSIX find; GNU and BSD/macOS differences labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "How do find's starting points and expression select files, and why must shell patterns be quoted?",
      answer: "find traverses each starting point, then evaluates its expression for every encountered path. Adjacent tests imply -and, so -type f -name '*.ts' requires both a regular file and a matching final pathname component. Quote *.ts so find receives the pattern; otherwise the shell may expand it before find starts. Supply an explicit starting point such as . for portability: GNU find accepts an omitted path as ., while BSD/macOS find expects a path.\n\nMemory hook: where to walk comes before what to test.",
    },
    read: {
      prompt: "Fixture:\ntree/src/app.ts\ntree/src/app.test.ts\ntree/src/sub/deep.ts\ntree/archive/report.log\n\nCommand:\nfind tree -maxdepth 2 -type f -name '*.ts' -print\n\nWhich paths are printed?",
      choices: ["tree/src/app.ts and tree/src/app.test.ts", "All three .ts files", "tree/archive/report.log", "Nothing because *.ts is quoted"],
      correctChoice: "tree/src/app.ts and tree/src/app.test.ts",
      answer: "The two .ts files two levels below tree are printed. deep.ts is one level deeper than -maxdepth 2, and the quoted pattern reaches find unchanged.",
    },
    write: {
      prompt: "Recursively print regular files whose names end in .log, starting at the current directory. Which portable core form fits?",
      choices: ["find . -type f -name '*.log' -print", "find -name *.log .", "find . '*.log' -type f", "find . -type d -name '*.log'"],
      correctChoice: "find . -type f -name '*.log' -print",
      answer: "The explicit . is the starting point, -type f and -name are implicitly ANDed, and quoting keeps the glob for find rather than the shell.",
    },
  },
  {
    command: "find",
    concept: "path-depth-empty",
    label: "-path, -maxdepth, and -empty",
    platform: "GNU and BSD/macOS find extensions beyond the POSIX core",
    references: [effectiveShell, gnuFind, appleFind],
    definition: {
      prompt: "How do -path, -maxdepth, and -empty narrow a find traversal?",
      answer: "-path PATTERN matches the whole pathname as find presents it, including directory components; quote the pattern. -maxdepth N applies tests and actions only through N levels below the starting point, where 0 means the starting point itself. -empty matches an empty regular file or empty directory. These useful primaries exist in GNU and current BSD/macOS find, but they are not in the portable POSIX core.\n\nMemory hook: path matches the route, maxdepth caps descent, empty tests contents.",
    },
    read: {
      prompt: "Fixture includes empty file tree/src/empty, empty directory tree/empty-dir, and nonempty tree/src/app.ts.\n\nCommand:\nfind tree -maxdepth 2 -path '*/src/*' -empty -print\n\nWhat is printed?",
      choices: ["tree/src/empty", "tree/empty-dir", "tree/src/app.ts", "Both empty paths"],
      correctChoice: "tree/src/empty",
      answer: "tree/src/empty is within the depth limit, its whole path matches */src/*, and it is empty. tree/empty-dir does not match the path pattern.",
    },
    write: {
      prompt: "Using GNU or current BSD/macOS find, print empty directories no deeper than three levels under the current directory. Which command fits?",
      choices: ["find . -maxdepth 3 -type d -empty -print", "find . -depth 3 -type d -empty", "find . -path 3 -empty -type d", "find . -maxdepth 3 -type f -empty -print"],
      correctChoice: "find . -maxdepth 3 -type d -empty -print",
      answer: "-maxdepth 3 caps the search, -type d limits matches to directories, and -empty requires those directories to contain no entries.",
    },
  },
  {
    command: "find",
    concept: "boolean-expression",
    label: "implicit -and, -o, !, and grouping",
    platform: "POSIX find; GNU and BSD/macOS long operator aliases labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "What is find's boolean precedence, and why do actions make grouping important?",
      answer: "Parentheses bind first, then !, then implicit or explicit AND, then OR. Evaluation short-circuits. The expression -type f -name '*.ts' -o -name '*.log' -print means ((type f AND name *.ts) OR (name *.log AND print)), so matching .ts files satisfy the left side without reaching -print. Group alternatives before one action: find . -type f \\( -name '*.ts' -o -name '*.log' \\) -print. Parentheses must be escaped or quoted from the shell. POSIX spells the operators !, -a, and -o; GNU and BSD/macOS also accept readable aliases such as -not and -or.\n\nMemory hook: AND binds tighter than OR; group the match, then act.",
    },
    read: {
      prompt: "Fixture has regular files app.ts, deep.ts, and report.log.\n\nCommand:\nfind tree -type f -name '*.ts' -o -name '*.log' -print\n\nWhat does this command print?",
      choices: ["Only tree/archive/report.log", "All three matching files", "Only the two .ts files", "Nothing"],
      correctChoice: "Only tree/archive/report.log",
      answer: "Implicit AND binds more tightly than -o. The .ts branch becomes true before reaching -print, while the .log branch evaluates its explicit -print action.",
    },
    write: {
      prompt: "Print regular .ts or .log files with one explicit action. Which shell command groups the alternatives correctly?",
      choices: ["find . -type f \\( -name '*.ts' -o -name '*.log' \\) -print", "find . -type f -name '*.ts' -o -name '*.log' -print", "find . \\( -type f -name '*.ts' \\) -o -name '*.log'", "find . -type f ! -name '*.ts' -o '*.log'"],
      correctChoice: "find . -type f \\( -name '*.ts' -o -name '*.log' \\) -print",
      answer: "The escaped parentheses make the name alternatives one test, which is ANDed with -type f before the single -print action runs.",
    },
  },
  {
    command: "find",
    concept: "size-ranges",
    label: "-size bounds and rounded units",
    platform: "POSIX find core; GNU and BSD/macOS size suffixes labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "How do find -size bounds and unit suffixes work, and what is wrong with -size +1G -500G?",
      answer: "Each bound needs its own -size primary: find . -type f -size +1G -size -500G -print. A leading + means greater than N size units, - means less than N units, and no sign means exactly N units. GNU M and G mean MiB and GiB, and file sizes are rounded up to the next unit before comparison, so boundaries deserve care. POSIX guarantees a smaller core based on 512-byte blocks and c bytes; suffix support differs by implementation. The bare -500G is not a second size test, so the seed command is malformed.\n\nMemory hook: repeat -size for every bound; signs compare rounded unit counts.",
    },
    read: {
      prompt: "GNU fixture sizes:\nexactly-1MiB.bin = 1,048,576 bytes\nover-1MiB.bin = 1,048,577 bytes\nexactly-2MiB.bin = 2,097,152 bytes\n\nCommand:\nfind tree -type f -size +1M -size -3M -print\n\nWhich files match?",
      choices: ["over-1MiB.bin and exactly-2MiB.bin", "Only over-1MiB.bin", "All three files", "Only exactly-1MiB.bin"],
      correctChoice: "over-1MiB.bin and exactly-2MiB.bin",
      answer: "GNU find rounds sizes up in MiB units. The unit counts are 1, 2, and 2, so the files with counts greater than 1 and less than 3 match.",
    },
    write: {
      prompt: "With GNU find, search /var for regular files whose rounded GiB unit count is greater than 1 and less than 500. Which expression is syntactically complete?",
      choices: ["find /var -type f -size +1G -size -500G -print", "find /var -type f -size +1G -500G", "find -size /var +1G -500G", "find /var -type f -size '+1G -500G'"],
      correctChoice: "find /var -type f -size +1G -size -500G -print",
      answer: "Both numeric comparisons have their own -size primary. The platform is explicit because G and its rounded-unit behavior are implementation-defined beyond POSIX.",
    },
  },
  {
    command: "find",
    concept: "timestamps",
    label: "-mtime versus -ctime and age rounding",
    platform: "POSIX and GNU find; BSD/macOS rounding difference labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "What do -mtime and -ctime measure, and how should age-number rounding be scoped?",
      answer: "-mtime tests when file data was last modified. -ctime tests when inode status last changed, such as after chmod, chown, or a data modification; it is not creation time. POSIX and GNU divide age by 24 hours and discard the remainder, so -mtime 1 means one completed 24-hour period ago, between 24 and 48 hours. +N means greater than N and -N less than N after that conversion. Apple's current BSD-derived man page instead describes rounding up, so label exact age questions by implementation or use a reference file with -newer for a precise timestamp boundary.\n\nMemory hook: m = data modified; c = inode status changed, never created.",
    },
    read: {
      prompt: "On GNU find, app.ts was modified 12 hours ago, app.test.ts 36 hours ago, and deep.ts 60 hours ago.\n\nCommand:\nfind tree/src -type f -mtime 1 -print\n\nWhich file matches?",
      choices: ["app.test.ts", "app.ts", "deep.ts", "All three files"],
      correctChoice: "app.test.ts",
      answer: "GNU rounds down to completed 24-hour periods: the three ages map to 0, 1, and 2. Only app.test.ts matches exact age number 1.",
    },
    write: {
      prompt: "On POSIX/GNU find, print regular files modified less than two completed 24-hour periods ago. Which test fits?",
      choices: ["find . -type f -mtime -2 -print", "find . -type f -mtime +2 -print", "find . -type f -ctime -2 -print", "find . -type f -mtime 2h -print"],
      correctChoice: "find . -type f -mtime -2 -print",
      answer: "-mtime -2 compares the completed-period age number with 2. Use -ctime only for inode-status changes, and do not assume this exact rounding on BSD/macOS.",
    },
  },
  {
    command: "find",
    concept: "permission-bits",
    label: "-perm exact, all bits, or any bits",
    platform: "POSIX and GNU find; BSD/macOS any-bit spelling labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "How do exact, all-bit, and any-bit forms of find -perm differ across GNU and BSD/macOS?",
      answer: "-perm MODE with no prefix requires an exact mode-bit match. -perm -MODE requires every bit named by MODE and is the portable all-bits form. GNU -perm /MODE requires any named bit; BSD/macOS uses -perm +MODE for that any-bit test instead. Therefore GNU -perm /a=x means executable by at least one class, not executable by all classes. Use -perm -a=x or -perm -111 when owner, group, and other execute bits must all be set. These tests inspect mode bits, not effective access after ACLs or filesystem restrictions.\n\nMemory hook: dash means all requested bits; GNU slash or BSD plus means any.",
    },
    read: {
      prompt: "GNU fixture modes:\napp.test.ts = 0744\ndeep.ts = 0711\n\nCommand:\nfind tree -type f -perm -111 -print\n\nWhich file matches?",
      choices: ["deep.ts only", "app.test.ts only", "Both files", "Neither file"],
      correctChoice: "deep.ts only",
      answer: "-111 requires all three execute bits. Mode 0711 has owner, group, and other execute; 0744 has only the owner's execute bit.",
    },
    write: {
      prompt: "Portably require owner, group, and other execute bits, while allowing unrelated extra bits. Which test fits?",
      choices: ["-perm -111", "-perm 111", "-perm /111", "-perm +111"],
      correctChoice: "-perm -111",
      answer: "The leading dash requires all bits named by 0111 while ignoring unrelated bits. Slash is GNU any-bit syntax, and plus is BSD/macOS any-bit syntax.",
    },
  },
  {
    command: "find",
    concept: "safe-actions",
    label: "-print0, xargs -0, -exec, and -ok",
    platform: "POSIX actions plus GNU and BSD/macOS NUL-safe extensions labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "How should find pass arbitrary pathnames to another command, and how do its execution actions differ?",
      answer: "Without an explicit action, find behaves as though -print were appended to the expression. -print writes newline-delimited names, which cannot represent a pathname containing a newline unambiguously. GNU and BSD/macOS -print0 paired with xargs -0 uses NUL boundaries and preserves spaces and newlines. POSIX -exec utility {} \\; invokes the utility once per path, while -exec utility {} + batches multiple literal path arguments without a text-parsing boundary. -ok is the interactive confirmation form and is intentionally unsuitable for unattended runs. Quote or escape the semicolon so the shell passes it to find.\n\nMemory hook: paths are arguments, not lines; use NUL or let -exec build argv directly.",
    },
    read: {
      prompt: "The search finds two files named two words.txt and line\\nbreak.txt, where the second name contains an actual newline.\n\nPipeline:\nfind tree/src -maxdepth 1 -type f -print0 | xargs -0 COMMAND\n\nHow many pathname arguments does COMMAND receive?",
      choices: ["Two complete pathname arguments", "Four words split on whitespace", "Three lines because one name contains a newline", "One NUL-containing pathname"],
      correctChoice: "Two complete pathname arguments",
      answer: "-print0 emits one NUL after each complete pathname and xargs -0 reads exactly that boundary, so spaces and the embedded newline remain data inside two arguments.",
    },
    write: {
      prompt: "Hash every regular file safely when names may contain spaces or newlines. Which GNU/BSD/macOS pipeline preserves boundaries?",
      choices: ["find . -type f -print0 | xargs -0 sha256sum", "find . -type f -print | xargs sha256sum", "find . -type f | xargs -L 1 sha256sum", "find . -type f -print0 | xargs sha256sum"],
      correctChoice: "find . -type f -print0 | xargs -0 sha256sum",
      answer: "Both sides agree on NUL boundaries. A portable alternative that avoids serializing names is find . -type f -exec sha256sum {} +.",
    },
  },
  {
    command: "find",
    concept: "symlink-delete-safety",
    label: "-P/-H/-L and preview before -delete",
    platform: "POSIX symlink modes plus GNU and BSD/macOS -delete behavior labeled",
    references: [effectiveShell, posixFind, gnuFind, appleFind],
    definition: {
      prompt: "How do find's symlink modes change traversal, and what makes -delete a high-risk action?",
      answer: "-P is the default: inspect symbolic links without following them. -H follows only symlinks supplied as starting points. -L follows encountered symlinks where possible, can traverse linked directories, and changes tests such as -type; place -H, -L, or -P before starting points. GNU and BSD/macOS -delete removes each matching path immediately and uses depth-first behavior, so a broad start point, precedence mistake, or link policy can be expensive. First run the exact scoped expression with -print, inspect it, then replace only the final -print with -delete. Keep -delete last.\n\nMemory hook: choose link policy before the walk; prove the match set before deletion.",
    },
    read: {
      prompt: "tree/links/source-link points to ../src, which contains app.ts and sub/deep.ts.\n\nCommand:\nfind -L tree/links -type f -name '*.ts' -print\n\nWhat does -L cause?",
      choices: ["find follows source-link and prints the .ts files below its target", "find prints source-link itself as a regular file", "find ignores the starting point", "find deletes the target files"],
      correctChoice: "find follows source-link and prints the .ts files below its target",
      answer: "-L follows the directory symlink during traversal, so -type f and -name are evaluated against files reached through the target. No delete action is present.",
    },
    write: {
      prompt: "Before deleting .tmp files under ./cache, which command is the right preview of the exact depth-first match set?",
      choices: ["find ./cache -depth -type f -name '*.tmp' -print", "find -L / -name '*.tmp' -delete", "find ./cache -delete -o -name '*.tmp'", "find ./cache -type f -print -delete"],
      correctChoice: "find ./cache -depth -type f -name '*.tmp' -print",
      answer: "The preview keeps the narrow starting point and full tests, makes depth-first order explicit, and performs only -print. After inspection, replace that final -print with -delete.",
    },
  },
];
