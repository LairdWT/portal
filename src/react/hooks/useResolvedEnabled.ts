// Resolves a control's enabled state with the standard precedence: an explicit
// value wins, then the ambient controller context, then the Enabled default. A
// control reads this instead of defaulting `enabled` directly, so a consumer can
// gate a whole controller from one ControllerProvider while a single control can
// still override.

import { EEnabledState } from '../../state/state';
import { useControllerContext } from '../ControllerContext';

export function useResolvedEnabled(explicit?: EEnabledState): EEnabledState {
    const ambient: EEnabledState | undefined = useControllerContext().enabled;
    return explicit ?? ambient ?? EEnabledState.Enabled;
}
