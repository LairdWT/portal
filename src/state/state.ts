export const EEnabledState: {
    readonly Enabled: 'enabled';
    readonly Disabled: 'disabled';
} = {
    Enabled: 'enabled',
    Disabled: 'disabled',
};
export type EEnabledState = (typeof EEnabledState)[keyof typeof EEnabledState];

export const EPressState: {
    readonly Pressed: 'pressed';
    readonly Released: 'released';
} = {
    Pressed: 'pressed',
    Released: 'released',
};
export type EPressState = (typeof EPressState)[keyof typeof EPressState];

export const EVisibility: {
    readonly Visible: 'visible';
    readonly Hidden: 'hidden';
} = {
    Visible: 'visible',
    Hidden: 'hidden',
};
export type EVisibility = (typeof EVisibility)[keyof typeof EVisibility];

export const ELoadStatus: {
    readonly Idle: 'idle';
    readonly Loading: 'loading';
    readonly Ready: 'ready';
    readonly Error: 'error';
} = {
    Idle: 'idle',
    Loading: 'loading',
    Ready: 'ready',
    Error: 'error',
};
export type ELoadStatus = (typeof ELoadStatus)[keyof typeof ELoadStatus];

export const EConnectionState: {
    readonly Disconnected: 'disconnected';
    readonly Connecting: 'connecting';
    readonly Connected: 'connected';
} = {
    Disconnected: 'disconnected',
    Connecting: 'connecting',
    Connected: 'connected',
};
export type EConnectionState =
    (typeof EConnectionState)[keyof typeof EConnectionState];
