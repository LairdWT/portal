import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Timeline.module.css';
import type { TimelineItem, TimelineProps } from './Timeline.types';

// A vertical activity feed: an ordered list of marker-dotted rows on a
// connecting rail. Reading order is the list order; status accents the dot
// and never carries meaning alone (the title and time text do).
export function Timeline({ label, items, tone }: TimelineProps): ReactElement {
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <ol className={className} style={toneProperties(tone)} aria-label={label}>
            {items.map(
                (item: TimelineItem): ReactElement => (
                    <li
                        key={item.id}
                        className={styles.item}
                        data-status={item.status}
                    >
                        <span className={styles.marker} aria-hidden="true">
                            <span className={styles.dot} />
                            <span className={styles.rail} />
                        </span>
                        <div className={styles.body}>
                            <div className={styles.head}>
                                <span className={styles.title}>{item.title}</span>
                                {item.time !== undefined ? (
                                    <span className={styles.time}>{item.time}</span>
                                ) : null}
                            </div>
                            {item.description !== undefined ? (
                                <div className={styles.description}>
                                    {item.description}
                                </div>
                            ) : null}
                        </div>
                    </li>
                ),
            )}
        </ol>
    );
}
