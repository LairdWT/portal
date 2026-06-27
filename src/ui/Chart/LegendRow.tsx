import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { Tooltip } from '../Tooltip/Tooltip';
import { withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import { type ChartLegendItem, type LegendRowProps } from './Chart.types';

export function LegendRow({ items, tone }: LegendRowProps): ReactElement {
    const rootClassName: string = withClass(
        toneStyles.toneScope,
        styles.legendList,
    );

    return (
        <div className={rootClassName} style={toneProperties(tone)}>
            {items.map((item: ChartLegendItem, index: number): ReactElement => {
                const valueText: string | undefined =
                    item.value !== undefined ? String(item.value) : undefined;
                const tooltipText: string =
                    valueText !== undefined
                        ? `${item.label}: ${valueText}`
                        : item.label;
                // A per-item tone gets its own nested scope so the swatch derives
                // its fill from that seed; an untoned item inherits the instance
                // scope on the row root.
                const itemClassName: string =
                    item.tone !== undefined
                        ? withClass(toneStyles.toneScope, styles.legendItem)
                        : withClass(styles.legendItem);
                return (
                    <Tooltip key={index} content={tooltipText}>
                        {/* Trigger-only button: no onClick, not an action. It is
                            only the focusable host the Tooltip needs so the hint
                            is keyboard-reachable rather than hover-only; the
                            label and value are also exposed as visible text. */}
                        <button
                            type="button"
                            className={itemClassName}
                            style={toneProperties(item.tone)}
                        >
                            <span className={styles.swatch} aria-hidden="true" />
                            <span className={styles.legendLabel}>{item.label}</span>
                            {valueText !== undefined ? (
                                <span className={styles.legendValue}>
                                    {valueText}
                                </span>
                            ) : null}
                        </button>
                    </Tooltip>
                );
            })}
        </div>
    );
}
