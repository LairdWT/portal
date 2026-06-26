import { type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Text.module.css';
import {
    ETextRole,
    type TextElement,
    type TextHeadingLevel,
    type TextProps,
} from './Text.types';

// Maps a heading level to its intrinsic tag. The level union is 1..6, so the
// switch is exhaustive and the tag name is never built by interpolation.
function headingTag(level: TextHeadingLevel): TextElement {
    switch (level) {
        case 1:
            return 'h1';
        case 2:
            return 'h2';
        case 3:
            return 'h3';
        case 4:
            return 'h4';
        case 5:
            return 'h5';
        case 6:
            return 'h6';
    }
}

// Resolves the element to render: an explicit `as` override wins; otherwise each
// role falls back to its default semantic element. The role enum is exhaustive,
// so every branch returns a concrete tag.
function resolveElement(
    role: ETextRole,
    as: TextElement | undefined,
    level: TextHeadingLevel,
): TextElement {
    if (as !== undefined) {
        return as;
    }
    switch (role) {
        case ETextRole.Heading:
            return headingTag(level);
        case ETextRole.Body:
            return 'p';
        case ETextRole.Section:
            return 'p';
        case ETextRole.Secondary:
            return 'span';
        case ETextRole.Dim:
            return 'span';
        case ETextRole.Accent:
            return 'span';
        case ETextRole.Mono:
            return 'code';
        case ETextRole.Styled:
            return 'span';
    }
}

// Shared attributes every rendered element carries: the joined tone-scope class,
// the inline tone custom property, and the data-role attribute the CSS keys off.
type TextRenderProps = Readonly<{
    className: string;
    style: CSSProperties;
    role: ETextRole;
    children: ReactNode;
}>;

// Renders the resolved intrinsic element with the shared attributes. Each branch
// is an explicit JSX literal (not a dynamic component variable) so the data-role
// attribute keeps its hyphenated-attribute typing and the renderer never creates
// a component during render. The element union is exhaustive.
function renderElement(
    element: TextElement,
    render: TextRenderProps,
): ReactElement {
    const { className, style, role, children }: TextRenderProps = render;
    switch (element) {
        case 'p':
            return (
                <p className={className} style={style} data-role={role}>
                    {children}
                </p>
            );
        case 'span':
            return (
                <span className={className} style={style} data-role={role}>
                    {children}
                </span>
            );
        case 'div':
            return (
                <div className={className} style={style} data-role={role}>
                    {children}
                </div>
            );
        case 'label':
            return (
                <label className={className} style={style} data-role={role}>
                    {children}
                </label>
            );
        case 'small':
            return (
                <small className={className} style={style} data-role={role}>
                    {children}
                </small>
            );
        case 'strong':
            return (
                <strong className={className} style={style} data-role={role}>
                    {children}
                </strong>
            );
        case 'em':
            return (
                <em className={className} style={style} data-role={role}>
                    {children}
                </em>
            );
        case 'code':
            return (
                <code className={className} style={style} data-role={role}>
                    {children}
                </code>
            );
        case 'pre':
            return (
                <pre className={className} style={style} data-role={role}>
                    {children}
                </pre>
            );
        case 'h1':
            return (
                <h1 className={className} style={style} data-role={role}>
                    {children}
                </h1>
            );
        case 'h2':
            return (
                <h2 className={className} style={style} data-role={role}>
                    {children}
                </h2>
            );
        case 'h3':
            return (
                <h3 className={className} style={style} data-role={role}>
                    {children}
                </h3>
            );
        case 'h4':
            return (
                <h4 className={className} style={style} data-role={role}>
                    {children}
                </h4>
            );
        case 'h5':
            return (
                <h5 className={className} style={style} data-role={role}>
                    {children}
                </h5>
            );
        case 'h6':
            return (
                <h6 className={className} style={style} data-role={role}>
                    {children}
                </h6>
            );
    }
}

export function Text({
    role = ETextRole.Body,
    as,
    level = 2,
    children,
    tone,
}: TextProps): ReactElement {
    const element: TextElement = resolveElement(role, as, level);
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return renderElement(element, {
        className,
        style: toneProperties(tone),
        role,
        children,
    });
}
