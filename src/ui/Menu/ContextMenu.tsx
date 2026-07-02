import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EPopoverPlacement } from '../Popover/Popover.types';
import { MenuSurface } from './Menu';
import { type ContextMenuProps } from './Menu.types';

// Viewport-relative coordinates of the open point, fed to a zero-size virtual
// anchor so the reused Popover positioner places the menu at the cursor.
type PointerCoords = Readonly<{
    top: number;
    left: number;
}>;

// ContextMenu wraps a right-clickable region and opens a Menu at the pointer on
// the contextmenu event. A disabled menu never opens. Activation reports
// onSelect(id) and the Menu closes the whole tree; the keyboard contextmenu key
// and Shift+F10 open the menu anchored at the focused element. A single
// position:fixed zero-size element is the anchor: it is always mounted so its ref
// is stable, and its top/left move to the open point, which the shared Popover
// positioner reads to place (and flip/shift) the menu. The contextmenu and
// keyboard listeners are attached imperatively to the region so the wrapper holds
// no interactive role of its own (the right-click and Shift+F10 affordances are a
// progressive enhancement over arbitrary content), and both listeners are removed
// on cleanup.
export function ContextMenu(props: ContextMenuProps): ReactElement {
    const {
        items,
        onSelect,
        children,
        enabled,
        tone,
        label,
        labelledBy,
    }: ContextMenuProps = props;
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const disabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    const regionRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const anchorRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    // The element focused at open time. Popover's own restore captures
    // document.activeElement in an effect that runs AFTER the MenuList
    // auto-focus effect has already moved focus into the menu, so it snapshots
    // a menu item that is detached by close time and the restore no-ops,
    // stranding focus on <body>. Capturing here, inside the open handlers
    // (before any focus moves), feeds MenuSurface's onCloseFocusAnchor the real
    // opener - the same contract MenuBar fulfils with focusActiveButton.
    const openerRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(
        null,
    );

    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [coords, setCoords]: [
        PointerCoords,
        Dispatch<SetStateAction<PointerCoords>>,
    ] = useState<PointerCoords>({ top: 0, left: 0 });

    useEffect((): (() => void) | undefined => {
        const node: HTMLDivElement | null = regionRef.current;
        if (node === null) {
            return undefined;
        }
        if (disabled) {
            return undefined;
        }

        function handleContextMenu(event: MouseEvent): void {
            event.preventDefault();
            openerRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
            setCoords({ top: event.clientY, left: event.clientX });
            setOpen(true);
        }

        function handleKeyDown(event: KeyboardEvent): void {
            const isContextKey: boolean = event.key === 'ContextMenu';
            const isShiftF10: boolean = event.shiftKey && event.key === 'F10';
            if (!isContextKey && !isShiftF10) {
                return;
            }
            event.preventDefault();
            const source: HTMLElement | null =
                event.target instanceof HTMLElement
                    ? event.target
                    : regionRef.current;
            if (source === null) {
                return;
            }
            const rect: DOMRect = source.getBoundingClientRect();
            openerRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
            setCoords({ top: rect.top, left: rect.left });
            setOpen(true);
        }

        node.addEventListener('contextmenu', handleContextMenu);
        node.addEventListener('keydown', handleKeyDown);
        return (): void => {
            node.removeEventListener('contextmenu', handleContextMenu);
            node.removeEventListener('keydown', handleKeyDown);
        };
    }, [disabled]);

    function handleOpenChange(next: boolean): void {
        setOpen(next);
    }

    // Escape/activation closes route here via MenuSurface.closeTree; outside
    // clicks keep Popover's guarded restore instead, so a click that focuses
    // other content is never overridden.
    function focusOpener(): void {
        const opener: HTMLElement | null = openerRef.current;
        if (opener === null) {
            return;
        }
        if (!opener.isConnected) {
            return;
        }
        opener.focus();
    }

    const anchorStyle: CSSProperties = {
        position: 'fixed',
        top: `${String(coords.top)}px`,
        left: `${String(coords.left)}px`,
        inlineSize: 0,
        blockSize: 0,
        pointerEvents: 'none',
    };

    return (
        <div ref={regionRef}>
            {children}
            <div ref={anchorRef} aria-hidden="true" style={anchorStyle} />
            <MenuSurface
                items={items}
                open={open}
                onOpenChange={handleOpenChange}
                onSelect={onSelect}
                anchorRef={anchorRef}
                placement={EPopoverPlacement.Bottom}
                tone={tone}
                onCloseFocusAnchor={focusOpener}
                {...(label !== undefined ? { label } : {})}
                {...(labelledBy !== undefined ? { labelledBy } : {})}
            />
        </div>
    );
}
