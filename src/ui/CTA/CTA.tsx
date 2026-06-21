import { type ReactElement } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './CTA.module.css';
import {
    type CTAProps,
    type ECtaButtonType,
    ECtaSize,
    ECtaVariant,
} from './CTA.types';

export function CTA({
    children,
    label,
    variant = ECtaVariant.Primary,
    size = ECtaSize.Md,
    enabled,
    status = EUiStatus.None,
    onClick,
    type = 'button',
    tone,
}: CTAProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const buttonType: ECtaButtonType = type;

    function handleClick(): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                onClick?.();
        }
    }

    // Label content prefers children; the label string is the fallback and also
    // names the control for assistive tech when the button is icon-only.
    const content: CTAProps['children'] = children ?? label;

    // The root carries the tone scope (so the derived tone vars resolve) plus
    // the component root class. CSS-module keys are typed string | undefined, so
    // empty entries are filtered before joining.
    const classNames: readonly string[] = [toneStyles.toneScope, styles.cta].filter(
        (className: string | undefined): className is string =>
            className !== undefined,
    );
    const className: string = classNames.join(' ');

    return (
        <button
            type={buttonType}
            className={className}
            style={toneProperties(tone)}
            data-variant={variant}
            data-size={size}
            data-enabled={resolvedEnabled}
            data-status={status}
            disabled={isDisabled}
            aria-label={children === undefined ? label : undefined}
            onClick={handleClick}
        >
            {content}
        </button>
    );
}
