// @ts-check
// Consumer-install packaging smoke (zero new dependency: tsc + node only).
//
// Distinct from src/index.smoke.test.ts, which imports the four subpaths through
// SOURCE inside vitest. This script packs the real tarball and resolves every
// published subpath the way an INSTALLED consumer would, under BOTH a node16/ESM
// resolver and a bundler resolver, then loads each entry at runtime under Node
// ESM. It catches the ESM-only exports-map risk (exports carry only types+import,
// no require/default) and any subpath .d.ts or asset that fails to resolve.
//
// It is self-contained: build -> pack -> install into throwaway consumers ->
// tsc type-resolution -> node runtime-resolution. Scratch lives under the OS temp
// dir; it is deleted on success and left (with its path printed) on failure for
// diagnosis. Exits non-zero on any failure.

import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const packageName = pkg.name;
const tarballBase = `${packageName.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;

// Runtime peers (installed so the ./r3f runtime import resolves) and their type
// packages, pinned to the versions already in devDependencies so resolution
// matches what the library was built and typechecked against.
const RUNTIME_PEERS = [
    'react',
    'react-dom',
    'animejs',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
];
const TYPE_PEERS = ['@types/react', '@types/react-dom', '@types/three'];

// Each subpath resolved by both the type and the runtime checks. styles.css has
// no types (it is an asset), so it is asserted at runtime only.
const SUBPATHS = [
    '@laird-wt/portal',
    '@laird-wt/portal/theme',
    '@laird-wt/portal/r3f',
    '@laird-wt/portal/shaders',
    '@laird-wt/portal/styles.css',
];

// One resolver leg: a node16/ESM or bundler module-resolution mode under which
// every published subpath's type and runtime entry must resolve.
/**
 * @typedef {Readonly<{
 *     name: string;
 *     moduleResolution: string;
 *     module: string;
 *     typesAdvisory: boolean;
 * }>} ResolverConfig
 */

// Every TYPE leg is a hard gate. The published .d.ts are rolled per entry by
// vite-plugin-dts (rollupTypes), so they are self-contained with no relative
// specifiers and resolve cleanly under node16/nodenext as well as bundler. A
// non-zero tsc exit on any resolver fails the smoke (Residual A fix). The
// node16 RUNTIME leg still proves the ESM-only exports map loads under Node ESM.
const RESOLVERS = [
    {
        name: 'node16',
        moduleResolution: 'node16',
        module: 'node16',
        typesAdvisory: false,
    },
    {
        name: 'bundler',
        moduleResolution: 'bundler',
        module: 'esnext',
        typesAdvisory: false,
    },
];

/** @type {string[]} */
const failures = [];

// Output helper routed through process.stdout (the eslint config gives this
// Node script no browser/node globals, so `console` is intentionally avoided).
/**
 * @param {string} line
 * @returns {void}
 */
function log(line) {
    process.stdout.write(`${line}\n`);
}

/**
 * @param {string} label
 * @returns {void}
 */
function reportPass(label) {
    log(`PASS  ${label}`);
}

/**
 * @param {string} label
 * @param {string} detail
 * @returns {void}
 */
function reportFail(label, detail) {
    log(`FAIL  ${label}`);
    if (detail.length > 0) {
        log(detail);
    }
    failures.push(label);
}

// Run a shell command (pnpm resolves to a .cmd on Windows, so shell:true is
// required). Returns the captured result so the caller can branch on status.
/**
 * @param {string} command
 * @param {string} cwd
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runShell(command, cwd) {
    return spawnSync(command, {
        cwd,
        shell: true,
        encoding: 'utf8',
    });
}

/**
 * @param {string} name
 * @returns {string}
 */
function pinnedSpec(name) {
    const version = pkg.devDependencies[name];
    if (typeof version !== 'string') {
        throw new Error(`Missing devDependency version for ${name}`);
    }
    return `${name}@${version}`;
}

/**
 * @param {string} consumerDir
 * @param {ResolverConfig} resolver
 * @returns {void}
 */
function writeConsumerSources(consumerDir, resolver) {
    writeFileSync(
        join(consumerDir, 'package.json'),
        `${JSON.stringify(
            {
                name: `portal-smoke-${resolver.name}`,
                version: '0.0.0',
                private: true,
                type: 'module',
            },
            null,
            4,
        )}\n`,
    );
    // Import a real named symbol from each typed subpath so the resolver must load
    // every subpath's .d.ts; styles.css is excluded here (no types) and checked at
    // runtime instead.
    writeFileSync(
        join(consumerDir, 'consumer.ts'),
        [
            "import { CTA } from '@laird-wt/portal';",
            "import { OrbBackdrop } from '@laird-wt/portal/r3f';",
            "import { MAX_RIPPLES } from '@laird-wt/portal/shaders';",
            "import { PORTAL_TOKENS } from '@laird-wt/portal/theme';",
            '',
            'export const used: readonly unknown[] = [',
            '    CTA,',
            '    OrbBackdrop,',
            '    MAX_RIPPLES,',
            '    PORTAL_TOKENS,',
            '];',
            '',
        ].join('\n'),
    );
    writeFileSync(
        join(consumerDir, 'tsconfig.json'),
        `${JSON.stringify(
            {
                compilerOptions: {
                    module: resolver.module,
                    moduleResolution: resolver.moduleResolution,
                    noEmit: true,
                    strict: true,
                    jsx: 'react-jsx',
                    skipLibCheck: true,
                    lib: ['ESNext', 'DOM'],
                },
                include: ['consumer.ts'],
            },
            null,
            4,
        )}\n`,
    );
}

const RUNTIME_PROBE = [
    "await import('@laird-wt/portal');",
    "await import('@laird-wt/portal/theme');",
    "await import('@laird-wt/portal/shaders');",
    "await import('@laird-wt/portal/r3f');",
    "const { existsSync: exists } = await import('node:fs');",
    "const { fileURLToPath: toPath } = await import('node:url');",
    "const url = import.meta.resolve('@laird-wt/portal/styles.css');",
    "if (!exists(toPath(url))) { throw new Error('styles.css subpath unresolved'); }",
].join('\n');

/**
 * @returns {void}
 */
function main() {
    log(`Packaging smoke for ${packageName}@${pkg.version}`);
    log(`Subpaths under test: ${SUBPATHS.join(', ')}`);

    const build = runShell('pnpm build', repoRoot);
    if (build.status !== 0) {
        reportFail('build', `${build.stdout ?? ''}${build.stderr ?? ''}`);
        finish(null);
        return;
    }
    reportPass('build');

    const scratch = mkdtempSync(join(tmpdir(), 'portal-smoke-'));
    const pack = runShell(`pnpm pack --pack-destination "${scratch}"`, repoRoot);
    if (pack.status !== 0) {
        reportFail('pack', `${pack.stdout ?? ''}${pack.stderr ?? ''}`);
        finish(scratch);
        return;
    }
    const tgz = locateTarball(scratch);
    if (tgz === null) {
        reportFail('pack', `No .tgz produced in ${scratch}`);
        finish(scratch);
        return;
    }
    reportPass('pack');

    const installSpecs = [
        ...RUNTIME_PEERS.map(pinnedSpec),
        ...TYPE_PEERS.map(pinnedSpec),
    ].join(' ');

    for (const resolver of RESOLVERS) {
        const consumerDir = join(scratch, resolver.name);
        mkdirSync(consumerDir, { recursive: true });
        writeConsumerSources(consumerDir, resolver);

        const install = runShell(
            `pnpm add --ignore-workspace "${tgz}" ${installSpecs}`,
            consumerDir,
        );
        if (install.status !== 0) {
            reportFail(
                `install (${resolver.name})`,
                `${install.stdout ?? ''}${install.stderr ?? ''}`,
            );
            continue;
        }
        reportPass(`install (${resolver.name})`);

        // TYPE resolution: a non-zero tsc exit means a subpath type entry did not
        // resolve under this resolver.
        const tscConfig = join(consumerDir, 'tsconfig.json');
        const tsc = runShell(`pnpm exec tsc --noEmit -p "${tscConfig}"`, repoRoot);
        if (tsc.status !== 0) {
            reportFail(
                `types (${resolver.name})`,
                `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`,
            );
        } else {
            reportPass(`types (${resolver.name})`);
        }

        // RUNTIME resolution: every subpath import must actually load, and the
        // styles.css subpath must resolve to an existing file.
        const runtime = spawnSync(
            process.execPath,
            ['--input-type=module', '-e', RUNTIME_PROBE],
            { cwd: consumerDir, encoding: 'utf8' },
        );
        if (runtime.status !== 0) {
            reportFail(
                `runtime (${resolver.name})`,
                `${runtime.stdout ?? ''}${runtime.stderr ?? ''}`,
            );
        } else {
            reportPass(`runtime (${resolver.name})`);
        }
    }

    finish(scratch);
}

/**
 * @param {string} scratch
 * @returns {string | null}
 */
function locateTarball(scratch) {
    const direct = join(scratch, tarballBase);
    if (existsSync(direct)) {
        return direct;
    }
    const found = readdirSync(scratch).find((entry) => entry.endsWith('.tgz'));
    return found === undefined ? null : join(scratch, found);
}

/**
 * @param {string | null} scratch
 * @returns {void}
 */
function finish(scratch) {
    if (failures.length === 0) {
        if (scratch !== null) {
            rmSync(scratch, { recursive: true, force: true });
        }
        log('Packaging smoke PASSED');
        process.exit(0);
    }
    log(`Packaging smoke FAILED (${failures.length}): ${failures.join(', ')}`);
    if (scratch !== null) {
        log(`Scratch left for diagnosis: ${scratch}`);
    }
    process.exit(1);
}

main();
