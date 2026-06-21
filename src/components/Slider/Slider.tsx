import type { ChangeEvent, CSSProperties, ReactElement, RefObject } from 'react';
import { useRef } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import {
    type ScalarControlBinding,
    useScalarControl,
} from '../../react/hooks/useScalarControl';
import { EEnabledState } from '../../state/state';
import styles from './Slider.module.css';
import { type SliderProps } from './Slider.types';

const FILL_PROPERTY: string = '--portal-slider-fill';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function computeFillRatio(value: number, min: number, max: number): number {
    const span: number = max - min;
    if (span <= 0) {
        return 0;
    }
    return clamp((value - min) / span, 0, 1);
}

export function Slider({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    enabled,
    onChange,
    onSignal,
    descriptor,
    formatValueText,
}: SliderProps): ReactElement {
    const rootRef: RefObject<HTMLLabelElement | null> =
        useRef<HTMLLabelElement | null>(null);
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);

    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const fillRatio: number = computeFillRatio(value, min, max);
    const rootStyle: CSSProperties = {
        [FILL_PROPERTY]: String(fillRatio),
    };
    const { emitScalar }: ScalarControlBinding = useScalarControl(
        descriptor,
        onSignal,
    );
    const valueText: string | undefined = formatValueText?.(value);

    function pushFill(ratio: number): void {
        const root: HTMLLabelElement | null = rootRef.current;
        if (root === null) {
            return;
        }
        root.style.setProperty(FILL_PROPERTY, String(ratio));
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextValue: number = event.currentTarget.valueAsNumber;
        pushFill(computeFillRatio(nextValue, min, max));
        onChange?.(nextValue);
        emitScalar(nextValue);
    }

    return (
        <label ref={rootRef} className={styles.slider} style={rootStyle}>
            <span className={styles.label}>{label}</span>
            <span className={styles.track}>
                <input
                    className={styles.input}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={isDisabled}
                    aria-label={label}
                    aria-valuetext={valueText}
                    data-enabled={resolvedEnabled}
                    onChange={handleChange}
                />
            </span>
        </label>
    );
}
