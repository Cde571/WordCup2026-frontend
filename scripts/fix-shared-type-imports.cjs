const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "src");
const TYPE_NAMES = new Set(["Team", "Match", "Player"]);

function walk(dir) {
  const out = [];

  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(tsx|ts|astro)$/.test(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

function splitImports(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "));
}

function baseName(spec) {
  return spec.split(/\s+as\s+/i)[0].trim();
}

function unique(list) {
  return [...new Set(list)];
}

function fixSharedExports() {
  const sharedPath = path.join(root, "components", "wc26-fixed", "Shared.tsx");

  if (!fs.existsSync(sharedPath)) {
    console.log("AVISO: no existe Shared.tsx en wc26-fixed");
    return;
  }

  let content = fs.readFileSync(sharedPath, "utf8");
  const original = content;

  for (const typeName of TYPE_NAMES) {
    const hasExported =
      new RegExp(`export\\s+(type|interface)\\s+${typeName}\\b`).test(content);

    if (hasExported) continue;

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
      content =
        `export type Team = {
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
      content =
        `export type Match = {
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
      content =
        `export type Player = {
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
    fs.copyFileSync(sharedPath, sharedPath + ".bak-export-types");
    fs.writeFileSync(sharedPath, content, "utf8");
    console.log("OK: exports de tipos verificados en Shared.tsx");
  }
}

function fixFile(file) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  const collectedByPath = new Map();

  // 1. Quitar import type existentes desde wc26-fixed/Shared y guardarlos.
  content = content.replace(
    /import\s+type\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["']([^"']*wc26-fixed\/Shared)["'];\s*/g,
    (match, specs, importPath) => {
      const names = splitImports(specs);
      if (!collectedByPath.has(importPath)) collectedByPath.set(importPath, []);
      collectedByPath.get(importPath).push(...names);
      return "";
    }
  );

  // 2. Procesar imports normales desde wc26-fixed/Shared.
  content = content.replace(
    /import\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["']([^"']*wc26-fixed\/Shared)["'];/g,
    (match, specs, importPath) => {
      const names = splitImports(specs);

      const runtime = [];
      const types = [];

      for (const spec of names) {
        const base = baseName(spec);

        if (TYPE_NAMES.has(base)) {
          types.push(spec);
        } else {
          runtime.push(spec);
        }
      }

      if (types.length > 0) {
        if (!collectedByPath.has(importPath)) collectedByPath.set(importPath, []);
        collectedByPath.get(importPath).push(...types);
      }

      if (runtime.length === 0) {
        return "";
      }

      return `import { ${runtime.join(", ")} } from "${importPath}";`;
    }
  );

  // 3. Insertar import type limpio.
  for (const [importPath, specs] of collectedByPath.entries()) {
    const cleanSpecs = unique(specs).filter((spec) => TYPE_NAMES.has(baseName(spec)));

    if (cleanSpecs.length === 0) continue;

    const typeLine = `import type { ${cleanSpecs.join(", ")} } from "${importPath}";`;

    const importRegex = new RegExp(
      `import\\s+\\{[\\s\\S]*?\\}\\s+from\\s+["']${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'];`
    );

    if (importRegex.test(content)) {
      content = content.replace(importRegex, (m) => `${m}\n${typeLine}`);
    } else {
      const firstImport = content.match(/^import[\s\S]*?;\s*/m);

      if (firstImport) {
        content = content.replace(firstImport[0], firstImport[0] + typeLine + "\n");
      } else {
        content = typeLine + "\n" + content;
      }
    }
  }

  // 4. Limpiar líneas vacías excesivas.
  content = content.replace(/\n{4,}/g, "\n\n\n");

  if (content !== original) {
    fs.copyFileSync(file, file + ".bak-type-imports-final");
    fs.writeFileSync(file, content, "utf8");
    console.log("OK:", path.relative(process.cwd(), file));
    return true;
  }

  return false;
}

fixSharedExports();

const files = walk(root);
let changed = 0;

for (const file of files) {
  const before = changed;
  if (fixFile(file)) changed++;
}

console.log("\n============================================");
console.log("Corrección import type terminada");
console.log("Archivos modificados:", changed);
console.log("============================================");

// Verificación final: no deben quedar imports runtime de Team/Match/Player desde Shared.
let bad = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  const matches = content.match(
    /import\s+\{\s*([\s\S]*?)\s*\}\s+from\s+["'][^"']*wc26-fixed\/Shared["'];/g
  );

  if (!matches) continue;

  for (const m of matches) {
    const specText = m.match(/\{\s*([\s\S]*?)\s*\}/)?.[1] || "";
    const specs = splitImports(specText);

    for (const spec of specs) {
      if (TYPE_NAMES.has(baseName(spec))) {
        bad.push({
          file: path.relative(process.cwd(), file),
          importLine: m.replace(/\s+/g, " "),
        });
      }
    }
  }
}

if (bad.length > 0) {
  console.error("\nERROR: aún quedan imports incorrectos:");
  console.table(bad);
  process.exit(1);
}

console.log("OK: no quedan imports runtime incorrectos de Team/Match/Player.");
