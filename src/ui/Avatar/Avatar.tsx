import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Avatar.module.css';
import {
    type AvatarProps,
    deriveInitials,
    EAvatarContent,
    EAvatarShape,
    EAvatarSize,
} from './Avatar.types';

// Generic accessible name when the consumer supplies neither alt nor name but the
// box still must name itself (a bare icon/glyph avatar).
const DEFAULT_LABEL: string = 'Avatar';

// The built-in last-resort glyph (a neutral silhouette mark). A bullet-style
// placeholder kept ASCII-safe; CSS may restyle via the .glyph class.
const FALLBACK_GLYPH: string = '?';

// resolveContent: pure selection of the active fallback-chain link. Negative-first
// ordering matches the directive chain. `hasIcon` is precomputed by the caller
// because a ReactNode can legitimately be null/0/'' and must not be coerced.
function resolveContent(
    src: string | undefined,
    hasError: boolean,
    initials: string,
    hasIcon: boolean,
): EAvatarContent {
    if (src !== undefined && src.length > 0 && !hasError) {
        return EAvatarContent.Image;
    }
    if (initials.length > 0) {
        return EAvatarContent.Initials;
    }
    if (hasIcon) {
        return EAvatarContent.Icon;
    }
    return EAvatarContent.Glyph;
}

export function Avatar({
    src,
    name,
    alt,
    icon,
    size = EAvatarSize.Md,
    shape = EAvatarShape.Circle,
    status,
    decorative = false,
    tone,
}: AvatarProps): ReactElement {
    // The src that last failed to load. Latching the failed URL (rather than a
    // bare boolean) means a NEW src is retried automatically: hasError is derived
    // by comparing the current src to the latched one, so changing src clears the
    // error without an effect (no set-state-in-effect, nothing to reset on unmount).
    const [erroredSrc, setErroredSrc]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>,
    ] = useState<string | undefined>(undefined);

    const hasError: boolean = src !== undefined && erroredSrc === src;
    const initials: string = name !== undefined ? deriveInitials(name) : '';
    const hasIcon: boolean = icon !== undefined && icon !== null;
    const content: EAvatarContent = resolveContent(
        src,
        hasError,
        initials,
        hasIcon,
    );

    const shapeClass: string | undefined =
        shape === EAvatarShape.Bevel ? styles.shapeBevel : styles.shapeCircle;
    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const figureClassName: string = [styles.figure, shapeClass]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleError(): void {
        setErroredSrc(src);
    }

    // Image alt: blanked when decorative so the raster leaves the a11y tree.
    const imageAlt: string = decorative ? '' : (alt ?? name ?? '');
    // Fallback box label: alt -> name -> the generic DEFAULT_LABEL.
    const figureLabel: string = alt ?? name ?? DEFAULT_LABEL;

    // The figure gets role/label ONLY for a fallback (an <img> already carries the
    // name through `alt`) and is hidden when `decorative`. Built as one spread
    // object so exactOptionalPropertyTypes stays clean (no undefined-valued attrs).
    const figureA11y:
        | { readonly 'aria-hidden': true }
        | { readonly role: 'img'; readonly 'aria-label': string }
        | Record<string, never> = decorative
        ? { 'aria-hidden': true }
        : content === EAvatarContent.Image
          ? {}
          : { role: 'img', 'aria-label': figureLabel };

    const presenceClassName: string = [toneStyles.toneScope, styles.presence]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <span
            className={rootClassName}
            style={toneProperties(tone)}
            data-size={size}
            data-shape={shape}
            data-content={content}
        >
            <span className={figureClassName} {...figureA11y}>
                {content === EAvatarContent.Image ? (
                    // onError is a resource-load LIFECYCLE event, not a user
                    // interaction; it is the declarative way to drive the image ->
                    // initials fallback. The repo extends
                    // no-noninteractive-element-interactions to flag onError on a
                    // non-interactive <img>, so disable that one rule for this tag.
                    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                    <img
                        className={styles.image}
                        src={src}
                        alt={imageAlt}
                        onError={handleError}
                    />
                ) : content === EAvatarContent.Initials ? (
                    <span className={styles.initials} aria-hidden="true">
                        {initials}
                    </span>
                ) : content === EAvatarContent.Icon ? (
                    <span className={styles.glyph} aria-hidden="true">
                        {icon}
                    </span>
                ) : (
                    <span className={styles.glyph} aria-hidden="true">
                        {FALLBACK_GLYPH}
                    </span>
                )}
            </span>
            {status !== undefined ? (
                <span className={presenceClassName} data-status={status.status}>
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.srOnly}>{status.label}</span>
                </span>
            ) : null}
        </span>
    );
}
