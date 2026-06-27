import type { Meta, StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactElement } from 'react';
import { expect } from 'storybook/test';

import { EUiStatus, toneProperties } from './tone';
import toneStyles from './tone.module.css';

// Precedence-lock harness for the shared tone layer. It proves, in a REAL browser
// (the storybook vitest project, where var() and color-mix() resolve to concrete
// rgb), that a data-status set on a .toneScope element is AUTHORITATIVE over an
// inline --portal-tone seed on the SAME element. A jsdom unit test cannot prove
// this: jsdom stores custom properties as opaque strings and never resolves the
// derived ramp, so it cannot tell "inline tone wins" from "status wins".
//
// Each probe is an empty, text-free div whose only visual is a solid border whose
// color is a derived consuming property (var(--portal-tone-border)). Reading
// getComputedStyle(probe).borderTopColor yields the resolved color, so relative
// equality across probes locks the precedence without a brittle absolute rgb.
//
// These probes are non-visual measurement nodes, not shipped UI, so the global
// axe gate is disabled for this file (a11y: { test: 'off' }); there is no human
// content and no contrast target to check.

// An inline tone deliberately distinct from both status tokens, so a probe that
// (incorrectly) derived from the inline tone would differ from the status probe.
const TONE_INLINE: string = 'oklch(0.62 0.2 25)';

// Fixed box so the border actually renders and getComputedStyle returns its color.
const PROBE_BOX: CSSProperties = {
    width: '3rem',
    height: '3rem',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: 'var(--portal-tone-border)',
};

// Build a probe style by merging the fixed box with the inline tone seam (omitted
// when no tone is supplied, matching how real consumers spread toneProperties).
function probeStyle(tone?: string): CSSProperties {
    const style: CSSProperties = { ...PROBE_BOX, ...toneProperties(tone) };
    return style;
}

// Read the resolved border color of one probe; negative-first guard on lookup.
function borderColorOf(root: HTMLElement, testId: string): string {
    const probe: Element | null = root.querySelector(`[data-testid="${testId}"]`);
    if (probe === null) {
        throw new Error(`tonePrecedence: probe "${testId}" not found`);
    }
    return getComputedStyle(probe).borderTopColor;
}

// Assert status authority for one status token across the three-probe trio:
// A = inline tone AND status, B = status only, C = inline tone only.
// A must equal B (status authoritative) and differ from C (status != tone).
async function assertStatusAuthoritative(
    root: HTMLElement,
    prefix: string,
): Promise<void> {
    const colorA: string = borderColorOf(root, `${prefix}-probe-a`);
    const colorB: string = borderColorOf(root, `${prefix}-probe-b`);
    const colorC: string = borderColorOf(root, `${prefix}-probe-c`);
    // Sanity: a resolved color is a non-empty rgb(...) string in a real browser.
    await expect(colorA).not.toEqual('');
    // Status wins over the inline tone on the same element (A == B).
    await expect(colorA).toEqual(colorB);
    // The status ramp differs from the tone-only ramp (A != C), proving the
    // equality above is real authority, not both probes collapsing to one color.
    await expect(colorA).not.toEqual(colorC);
}

const meta: Meta = {
    title: 'UI/TonePrecedence',
    parameters: {
        // Measurement probes carry no human-readable content and no contrast
        // target; the axe color-contrast gate has nothing meaningful to assert
        // here, so it is disabled for this harness story only.
        a11y: { test: 'off' },
    },
};

export default meta;

type Story = StoryObj;

// danger: inline tone vs data-status='danger'. Pre-fix A==C (inline tone wins) and
// A!=B -> FAILS. Post-fix A==B and A!=C -> PASSES. A true precedence lock.
export const DangerPrecedence: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div
                data-testid="danger-probe-a"
                className={toneStyles.toneScope}
                data-status={EUiStatus.Danger}
                style={probeStyle(TONE_INLINE)}
            />
            <div
                data-testid="danger-probe-b"
                className={toneStyles.toneScope}
                data-status={EUiStatus.Danger}
                style={probeStyle()}
            />
            <div
                data-testid="danger-probe-c"
                className={toneStyles.toneScope}
                style={probeStyle(TONE_INLINE)}
            />
        </div>
    ),
    play: async ({
        canvasElement,
    }: {
        canvasElement: HTMLElement;
    }): Promise<void> => {
        await assertStatusAuthoritative(canvasElement, 'danger');
    },
};

// success: same lock for the success token, so both shared status tokens are
// covered (not just danger).
export const SuccessPrecedence: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div
                data-testid="success-probe-a"
                className={toneStyles.toneScope}
                data-status={EUiStatus.Success}
                style={probeStyle(TONE_INLINE)}
            />
            <div
                data-testid="success-probe-b"
                className={toneStyles.toneScope}
                data-status={EUiStatus.Success}
                style={probeStyle()}
            />
            <div
                data-testid="success-probe-c"
                className={toneStyles.toneScope}
                style={probeStyle(TONE_INLINE)}
            />
        </div>
    ),
    play: async ({
        canvasElement,
    }: {
        canvasElement: HTMLElement;
    }): Promise<void> => {
        await assertStatusAuthoritative(canvasElement, 'success');
    },
};
