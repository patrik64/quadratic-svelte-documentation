// Verifies the docs against the source project. Run with `pnpm check`.
//
// Three classes of problem, all of which are silent without this:
//   drift    — a fenced excerpt no longer matches the file it quotes
//   orphans  — a page documents a source file that no longer exists
//   MDX      — annotations or characters that break the build or render as junk
//
// The source checks need ../quadratic-svelte; without it only the MDX lint
// runs, so the script is still useful in a checkout of this repo alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content', 'docs');
const PROJECT = path.resolve(ROOT, '..', 'quadratic-svelte');
const hasProject = fs.existsSync(PROJECT);

/** Pages that document the project as a whole rather than one file. */
const STANDALONE = /\/(index|architecture|findings)\.mdx$/;
/** Lines inside a fence that mark an omission or a Code Hike annotation. */
const isMarker = (line) => {
  const t = line.trim();
  return t === '// ...' || t === '# ...' || /^\/\/ !\w/.test(t);
};

let problems = 0;
const report = (file, msg) => {
  problems++;
  console.log(`${path.relative(ROOT, file)}: ${msg}`);
};

const mdxFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.mdx')) mdxFiles.push(full);
  }
})(CONTENT);

const documented = new Set();
let fencesChecked = 0;
let linesChecked = 0;

for (const file of mdxFiles.sort()) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) {
    report(file, 'missing frontmatter');
    continue;
  }
  const generated = /^generated:\s*true$/m.test(fm[1]);
  const standalone = STANDALONE.test(file);

  // ---------- frontmatter ----------
  for (const key of standalone ? ['title', 'description'] : ['title', 'description', 'source']) {
    if (!new RegExp(`^${key}:`, 'm').test(fm[1])) report(file, `frontmatter missing ${key}`);
  }

  // ---------- the source this page documents ----------
  const sourceRel = /^source:\s*"?([^"\n]+)"?$/m.exec(fm[1])?.[1];
  let sourceLines;
  if (sourceRel && hasProject) {
    documented.add(sourceRel);
    const sourcePath = path.join(PROJECT, sourceRel);
    if (!fs.existsSync(sourcePath)) {
      report(file, `orphan: source file ${sourceRel} no longer exists`);
    } else {
      sourceLines = new Set(fs.readFileSync(sourcePath, 'utf8').split('\n'));
    }
  }

  const body = text.slice(fm[0].length);
  const lines = body.split('\n');

  let fence = null;
  let fenceLang = null;
  let fenceStart = 0;
  let inSvelteScript = false;
  let steps = 0;
  let fencesInStep = 0;
  const prose = [];

  for (const [i, line] of lines.entries()) {
    const open = /^(\s*)(`{3,})(.*)$/.exec(line);

    if (fence) {
      if (open && open[2].length >= fence.length && open[3].trim() === '') {
        fence = null;
        inSvelteScript = false;
        continue;
      }
      // Code Hike strips `// !mark` only where `//` is a real comment. In a
      // .svelte fence that means the <script> region only — elsewhere the
      // annotation renders as a literal line and highlights nothing.
      if (fenceLang === 'svelte') {
        if (/^\s*<script\b/.test(line)) inSvelteScript = true;
        else if (/^\s*<\/script>/.test(line)) inSvelteScript = false;
        else if (!inSvelteScript && /^\s*\/\/ !\w/.test(line)) {
          report(file, `line ${fenceStart + i}: "${line.trim()}" is outside <script> in a svelte fence — it renders literally`);
        }
      }
      // drift: every quoted line must still exist in the file it came from
      if (sourceLines && !generated && !isMarker(line)) {
        linesChecked++;
        if (!sourceLines.has(line)) {
          report(file, `line ${fenceStart + i}: no longer matches ${sourceRel} — ${JSON.stringify(line.trim().slice(0, 60))}`);
        }
      }
      continue;
    }

    if (open) {
      const info = open[3].trim();
      if (info !== '') {
        fence = open[2];
        fenceLang = info.split(/\s+/)[0];
        fenceStart = i + 2;
        inSvelteScript = false;
        fencesInStep++;
        fencesChecked++;
        if (steps > 0 && !/^\S+\s+!\s+\S+/.test(info)) {
          report(file, `line ${i + 1}: step fence should be "lang ! filename", got "${info}"`);
        }
      }
      continue;
    }

    if (/^##\s+!!steps\s/.test(line)) {
      if (steps > 0 && fencesInStep !== 1) {
        report(file, `step ${steps} has ${fencesInStep} code blocks (expected exactly 1)`);
      }
      steps++;
      fencesInStep = 0;
      const title = line.replace(/^##\s+!!steps\s+/, '');
      if (/[`<>{}]/.test(title)) report(file, `step title has special chars: "${title}"`);
      continue;
    }
    prose.push([i + 1, line]);
  }

  if (fence) report(file, 'unclosed code fence');
  if (steps > 0 && fencesInStep !== 1) {
    report(file, `last step has ${fencesInStep} code blocks (expected exactly 1)`);
  }

  const open = (body.match(/<Scrollycoding>/g) ?? []).length;
  const close = (body.match(/<\/Scrollycoding>/g) ?? []).length;
  if (open !== close) report(file, `unbalanced Scrollycoding tags (${open}/${close})`);
  if (open > 0 && steps === 0) report(file, 'Scrollycoding block with no !!steps');

  // raw JSX-ish characters in prose break the MDX parse
  for (const [n, line] of prose) {
    const stripped = line.replace(/`[^`]*`/g, '').replace(/<\/?Scrollycoding>/g, '');
    const bad = stripped.match(/[<>{}]/g);
    if (bad) report(file, `line ${n}: raw ${[...new Set(bad)].join(' ')} in prose — wrap in backticks`);
  }
}

// ---------- source files with no page at all ----------
if (hasProject) {
  const INCLUDE = ['src', 'quadratic-core/src', 'scripts'];
  const SKIP = new Set(['node_modules', 'target', 'pkg', '.svelte-kit', 'assets']);
  const EXT = new Set(['.ts', '.js', '.mjs', '.svelte', '.rs', '.css', '.html', '.json']);
  const missing = [];
  for (const dir of INCLUDE) {
    const base = path.join(PROJECT, dir);
    if (!fs.existsSync(base)) continue;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (EXT.has(path.extname(e.name))) {
          const rel = path.relative(PROJECT, full);
          if (!documented.has(rel)) missing.push(rel);
        }
      }
    })(base);
  }
  if (missing.length > 0) {
    problems += missing.length;
    console.log(`\n${missing.length} source file(s) have no page — run \`pnpm gen\`:`);
    for (const m of missing.sort()) console.log(`  ${m}`);
  }
}

console.log();
if (!hasProject) {
  console.log('note: ../quadratic-svelte not found — drift and orphan checks skipped');
}
console.log(
  problems === 0
    ? `ok — ${mdxFiles.length} pages, ${fencesChecked} code blocks, ${linesChecked} quoted lines verified`
    : `${problems} problem(s) across ${mdxFiles.length} pages`,
);
process.exit(problems === 0 ? 0 : 1);
