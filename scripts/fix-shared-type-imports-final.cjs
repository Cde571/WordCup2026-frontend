const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "src");
const TYPE_NAMES = new Set(["Team", "Match", "Player"]);

function walk(dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(tsx|ts|astro)$/.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

function splitSpecs(raw) {
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function baseName(spec) {
  return spec.split(/\s+as\s+/i)[0].trim();
}

function unique(list) {
  return [...new Set(list)];
}

function ensureSharedTypes() {
  const sharedPath = path.join(root, "components", "wc26-fixed", "Shared.tsx");

  if (!fs.existsSync(sharedPath)) {
    return;
  }

  let content = fs.readFileSync(sharedPath, "utf8");
  const original = content;

  for (const typeName of TYPE_NAMES) {
    const exported = new RegExp(`export\\s+(type|interface)\\s+${typeName}\\b`).test(content);

    if (exported) continue;

    const typeRegex = new RegExp(`(^|\\n)(\\s*)type\\s+${typeName}\\s*=`, "m");
    const interfaceRegex = new RegExp(`(^|\\n)(\\s*)interface\\s+${typeName}\\b`, "m");

    if (typeRegex.test(content)) {
      content = content.replace(typeRegex, `$1$2export type ${typeName} =`);
      continue;
    }

    if (interfaceRegex.test(content)) {
      content = content.replace(interfaceRegex, `$1$2export interface ${typeName}`);
      continue;
    }

    if (typeName === "Team") {
      content = `export type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
  logo?: string | null;
};

` + content;
    }

    if (typeName === "Match") {
      content = `export type Match = {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  matchDate?: string;
  stadium?: string | null;
  group?: string | null;
  status?: string | null;
};

` + content;
    }

    if (typeName === "Player") {
      content = `export type Player = {
  _id: string;
  name: string;
  number?: number | null;
  position?: string | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
  team?: Team | string;
};

` + content;
    }
  }

  if (content !== original) {
    fs.copyFileSync(sharedPath, sharedPath + ".bak-shared-types-final");
    fs.writeFileSync(sharedPath, content, "utf8");
    console.log("OK: Shared.tsx exporta tipos.");
  }
}

function fixFile(file) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  const typeImports = new Map();

  content = content.replace(
    /import\s+type\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["']([^"']*wc26-fixed\/Shared)["'];\s*/g,
    (_, specs, importPath) => {
      const list = splitSpecs(specs);
      if (!typeImports.has(importPath)) typeImports.set(importPath, []);
      typeImports.get(importPath).push(...list);
      return "";
    }
  );

  content = content.replace(
    /import\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["']([^"']*wc26-fixed\/Shared)["'];/g,
    (_, specs, importPath) => {
      const list = splitSpecs(specs);
      const runtime = [];
      const types = [];

      for (const spec of list) {
        const base = baseName(spec);

        if (TYPE_NAMES.has(base)) {
          types.push(spec);
        } else {
          runtime.push(spec);
        }
      }

      if (types.length) {
        if (!typeImports.has(importPath)) typeImports.set(importPath, []);
        typeImports.get(importPath).push(...types);
      }

      if (!runtime.length) return "";

      return `import { ${runtime.join(", ")} } from "${importPath}";`;
    }
  );

  for (const [importPath, specs] of typeImports.entries()) {
    const cleaned = unique(specs).filter((spec) => TYPE_NAMES.has(baseName(spec)));
    if (!cleaned.length) continue;

    const typeLine = `import type { ${cleaned.join(", ")} } from "${importPath}";`;

    const runtimeRegex = new RegExp(
      `import\\s+\\{[\\s\\S]*?\\}\\s+from\\s+["']${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'];`
    );

    if (runtimeRegex.test(content)) {
      content = content.replace(runtimeRegex, (match) => `${match}\n${typeLine}`);
    } else {
      const firstImport = content.match(/^import[\s\S]*?;\s*/m);
      if (firstImport) {
        content = content.replace(firstImport[0], firstImport[0] + typeLine + "\n");
      } else {
        content = typeLine + "\n" + content;
      }
    }
  }

  content = content.replace(/\n{4,}/g, "\n\n\n");

  if (content !== original) {
    fs.copyFileSync(file, file + ".bak-type-imports-route-final");
    fs.writeFileSync(file, content, "utf8");
    console.log("OK:", path.relative(process.cwd(), file));
    return true;
  }

  return false;
}

ensureSharedTypes();

const files = walk(root);
let changed = 0;

for (const file of files) {
  if (fixFile(file)) changed++;
}

console.log("Archivos corregidos:", changed);

const bad = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const imports = content.match(/import\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["'][^"']*wc26-fixed\/Shared["'];/g) || [];

  for (const line of imports) {
    const specs = splitSpecs(line.match(/\{\s*([\s\S]*?)\s*\}/)?.[1] || "");

    for (const spec of specs) {
      if (TYPE_NAMES.has(baseName(spec))) {
        bad.push({
          file: path.relative(process.cwd(), file),
          line: line.replace(/\s+/g, " "),
        });
      }
    }
  }
}

if (bad.length) {
  console.error("Aún quedan imports incorrectos:");
  console.table(bad);
  process.exit(1);
}

console.log("OK: Team/Match/Player ya no entran como runtime imports.");
