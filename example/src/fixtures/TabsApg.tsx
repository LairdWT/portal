import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { Tabs, type TabItem } from '@laird-wt/portal';

// Tabs APG relationship fixture: a controlled Tabs whose every TabItem carries a
// `controls` id, paired with consumer-owned role="tabpanel" elements. Because the
// per-tab DOM id is `${useId()}-tab-${item.id}` and is not knowable up front, an
// effect reads the rendered tab ids back and writes each panel's aria-labelledby
// from them, so all three tab->panel and panel->tab relationships are assertable
// in a real id graph (option (a) in the plan).

const DOC_ITEMS: readonly TabItem[] = [
    { id: 'intro', label: 'Intro', controls: 'panel-intro' },
    { id: 'api', label: 'API', controls: 'panel-api' },
    { id: 'faq', label: 'FAQ', controls: 'panel-faq' },
];

export function TabsApg(): ReactElement {
    const [selected, setSelected]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('intro');
    // Map item.id -> the runtime DOM id Tabs assigned to that tab button.
    const [tabIds, setTabIds]: [
        Readonly<Record<string, string>>,
        Dispatch<SetStateAction<Readonly<Record<string, string>>>>,
    ] = useState<Readonly<Record<string, string>>>({});
    const tablistRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    // The per-tab id is deterministic per Tabs instance but seeded by useId, so it
    // is read back after mount. The set is stable across renders (useId is stable),
    // so a single mount-time read is sufficient.
    useEffect((): void => {
        const container: HTMLDivElement | null = tablistRef.current;
        if (container === null) {
            return;
        }
        const tabs: NodeListOf<HTMLElement> =
            container.querySelectorAll<HTMLElement>('[role="tab"]');
        const next: Record<string, string> = {};
        tabs.forEach((tab: HTMLElement): void => {
            const match: TabItem | undefined = DOC_ITEMS.find(
                (item: TabItem): boolean => tab.id.endsWith(`-tab-${item.id}`),
            );
            if (match !== undefined) {
                next[match.id] = tab.id;
            }
        });
        setTabIds(next);
    }, []);

    return (
        <main>
            <div ref={tablistRef}>
                <Tabs
                    label="Docs"
                    items={DOC_ITEMS}
                    value={selected}
                    onChange={setSelected}
                />
            </div>
            {DOC_ITEMS.map((item: TabItem): ReactElement => {
                const isActive: boolean = item.id === selected;
                const labelledBy: string | undefined = tabIds[item.id];
                return (
                    <div
                        key={item.id}
                        id={`panel-${item.id}`}
                        role="tabpanel"
                        hidden={!isActive}
                        {...(labelledBy !== undefined
                            ? { 'aria-labelledby': labelledBy }
                            : {})}
                    >
                        {item.label} panel content
                    </div>
                );
            })}
        </main>
    );
}
