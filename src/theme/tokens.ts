/**
 * Typed mirror of the Portal CSS custom properties declared in tokens.css.
 *
 * Each value is a CSS `var()` reference, not a raw literal. This lets
 * JavaScript and TypeScript consumers (for example React Three Fiber
 * material colors) reference the same logical token the stylesheet uses,
 * so a single theme override updates both the DOM and the 3D surface.
 *
 * The CSS file in tokens.css is the single source of truth for values.
 */

export type PortalTokens = {
    readonly color: {
        readonly bg0: string;
        readonly bg1: string;
        readonly surface0: string;
        readonly surface1: string;
        readonly border: string;
        readonly borderAccent: string;
        readonly text0: string;
        readonly text1: string;
        readonly accent: string;
        readonly accentHighlight: string;
        readonly focus: string;
        readonly danger: string;
        readonly success: string;
        readonly warning: string;
    };
    readonly space: {
        readonly s1: string;
        readonly s2: string;
        readonly s3: string;
        readonly s4: string;
        readonly s5: string;
        readonly s6: string;
        readonly s7: string;
        readonly s8: string;
    };
    readonly radius: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
        readonly xl: string;
        readonly pill: string;
    };
    readonly sizeText: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly touchTarget: {
        readonly min: string;
        readonly max: string;
    };
    readonly borderThickness: {
        readonly thin: string;
        readonly normal: string;
        readonly bold: string;
    };
    readonly zIndex: {
        readonly overlay: string;
    };
    readonly duration: {
        readonly frame: {
            readonly fast: string;
            readonly base: string;
            readonly slow: string;
        };
        readonly ui: {
            readonly fast: string;
            readonly base: string;
            readonly slow: string;
        };
    };
    readonly easing: {
        readonly standard: string;
        readonly emphasized: string;
    };
    readonly font: {
        readonly sans: string;
        readonly mono: string;
    };
    readonly lineHeight: {
        readonly tight: string;
        readonly normal: string;
    };
    readonly letterSpacing: {
        readonly wide: string;
    };
};

export const PORTAL_TOKENS: PortalTokens = {
    color: {
        bg0: 'var(--portal-color-bg-0)',
        bg1: 'var(--portal-color-bg-1)',
        surface0: 'var(--portal-color-surface-0)',
        surface1: 'var(--portal-color-surface-1)',
        border: 'var(--portal-color-border)',
        borderAccent: 'var(--portal-color-border-accent)',
        text0: 'var(--portal-color-text-0)',
        text1: 'var(--portal-color-text-1)',
        accent: 'var(--portal-color-accent)',
        accentHighlight: 'var(--portal-color-accent-highlight)',
        focus: 'var(--portal-color-focus)',
        danger: 'var(--portal-color-danger)',
        success: 'var(--portal-color-success)',
        warning: 'var(--portal-color-warning)',
    },
    space: {
        s1: 'var(--portal-space-1)',
        s2: 'var(--portal-space-2)',
        s3: 'var(--portal-space-3)',
        s4: 'var(--portal-space-4)',
        s5: 'var(--portal-space-5)',
        s6: 'var(--portal-space-6)',
        s7: 'var(--portal-space-7)',
        s8: 'var(--portal-space-8)',
    },
    radius: {
        sm: 'var(--portal-radius-sm)',
        md: 'var(--portal-radius-md)',
        lg: 'var(--portal-radius-lg)',
        xl: 'var(--portal-radius-xl)',
        pill: 'var(--portal-radius-pill)',
    },
    sizeText: {
        sm: 'var(--portal-size-text-sm)',
        md: 'var(--portal-size-text-md)',
        lg: 'var(--portal-size-text-lg)',
    },
    touchTarget: {
        min: 'var(--portal-touch-target-min)',
        max: 'var(--portal-touch-target-max)',
    },
    borderThickness: {
        thin: 'var(--portal-border-thickness-thin)',
        normal: 'var(--portal-border-thickness-normal)',
        bold: 'var(--portal-border-thickness-bold)',
    },
    zIndex: {
        overlay: 'var(--portal-z-overlay)',
    },
    duration: {
        frame: {
            fast: 'var(--portal-duration-frame-fast)',
            base: 'var(--portal-duration-frame-base)',
            slow: 'var(--portal-duration-frame-slow)',
        },
        ui: {
            fast: 'var(--portal-duration-ui-fast)',
            base: 'var(--portal-duration-ui-base)',
            slow: 'var(--portal-duration-ui-slow)',
        },
    },
    easing: {
        standard: 'var(--portal-easing-standard)',
        emphasized: 'var(--portal-easing-emphasized)',
    },
    font: {
        sans: 'var(--portal-font-sans)',
        mono: 'var(--portal-font-mono)',
    },
    lineHeight: {
        tight: 'var(--portal-line-height-tight)',
        normal: 'var(--portal-line-height-normal)',
    },
    letterSpacing: {
        wide: 'var(--portal-letter-spacing-wide)',
    },
};
