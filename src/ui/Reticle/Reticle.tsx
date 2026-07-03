import { type CSSProperties, type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Reticle.module.css';
import { EReticleVariant, type ReticleProps } from './Reticle.types';

const SPREAD_PROPERTY: string = '--portal-reticle-spread';

const ARM_POSITIONS: readonly string[] = ['up', 'down', 'start', 'end'];
const BRACKET_CORNERS: readonly string[] = [
    'top-start',
    'top-end',
    'bottom-start',
    'bottom-end',
];

// The Reticle: a decorative machined aiming glyph. Everything here is
// aria-hidden presentation; spread rides one CSS custom property so the
// bloom animates as a transform offset, and the hit flash is a keyed
// remount running a one-shot transform/opacity animation (suppressed under
// reduced motion - it never carries meaning alone).
export function Reticle({
    variant = EReticleVariant.Cross,
    spreadPx = 0,
    hitToken,
    tone,
}: ReticleProps): ReactElement {
    const spread: number = Number.isFinite(spreadPx) ? Math.max(0, spreadPx) : 0;
    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        [SPREAD_PROPERTY]: `${String(spread)}px`,
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <span
            className={className}
            style={rootStyle}
            data-variant={variant}
            role="presentation"
            aria-hidden="true"
        >
            {variant === EReticleVariant.Cross
                ? ARM_POSITIONS.map(
                      (position: string): ReactElement => (
                          <span
                              key={position}
                              className={styles.arm}
                              data-position={position}
                          />
                      ),
                  )
                : null}
            {variant === EReticleVariant.Brackets
                ? BRACKET_CORNERS.map(
                      (corner: string): ReactElement => (
                          <span
                              key={corner}
                              className={styles.bracket}
                              data-corner={corner}
                          />
                      ),
                  )
                : null}
            {variant === EReticleVariant.Circle ? (
                <span className={styles.ring} />
            ) : null}
            {variant === EReticleVariant.Dot ||
            variant === EReticleVariant.Circle ||
            variant === EReticleVariant.Cross ? (
                <span className={styles.dot} />
            ) : null}
            {hitToken !== undefined && hitToken > 0 ? (
                <span key={hitToken} className={styles.hit} />
            ) : null}
        </span>
    );
}
