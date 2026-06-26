import { type EUiStatus, type Toned } from '../tone';

// Which of the two badge forms to render. Modeled as an E-prefixed const-object
// enum (enums-as-language are banned) so the two distinct presentations are a
// named member set. The kebab-case values double as the data-kind attribute the
// CSS reads to switch between the labelled status chip and the numeric count
// badge. Kind is the discriminant of the BadgeProps union below.
export const EBadgeKind: {
    readonly Status: 'status';
    readonly Count: 'count';
} = {
    Status: 'status',
    Count: 'count',
};
export type EBadgeKind = (typeof EBadgeKind)[keyof typeof EBadgeKind];

// Properties shared by both badge kinds. `status` is the universal (non-domain)
// danger/success signal surfaced through the data-status attribute the tone
// scope reads; `tone` is an opaque CSS color seed flowing through the same scope.
// Neither carries domain meaning - the consumer binds that.
type BadgeCommonProps = Readonly<{
    status?: EUiStatus;
}> &
    Toned;

// The status badge: a small dot plus a label presented as one live status unit.
// It carries role="status" and an aria-label so assistive technology reads it as
// a single announcement. The leading dot is decorative; the label is the meaning,
// so state is never conveyed by color alone. `showDot` defaults to true.
type BadgeStatusProps = Readonly<{
    kind: typeof EBadgeKind.Status;
    label: string;
    showDot?: boolean;
}>;

// The count badge: a numeric indicator that clamps large values. When `count`
// exceeds `max` (default 99) it renders `${max}+` (for example "99+"). An
// optional `label` names what is being counted; it is combined with the rendered
// number into the badge's accessible label (for example "12 notifications").
type BadgeCountProps = Readonly<{
    kind: typeof EBadgeKind.Count;
    count: number;
    max?: number;
    label?: string;
}>;

// Props for the Badge. A discriminated union on `kind`: a labelled status chip or
// a clamped numeric count badge. Both are non-interactive (no button, no focus
// target, no motion) and both flow tone + status through the shared tone scope.
export type BadgeProps = (BadgeStatusProps | BadgeCountProps) & BadgeCommonProps;
