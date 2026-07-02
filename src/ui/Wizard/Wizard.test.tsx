import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { Wizard } from './Wizard';
import type { WizardStep } from './Wizard.types';

const STEPS: readonly WizardStep[] = [
    { id: 'plan', label: 'Plan', content: <p>Plan the route.</p> },
    { id: 'load', label: 'Load', content: <p>Load the cargo.</p> },
    { id: 'launch', label: 'Launch', content: <p>Launch the convoy.</p> },
];

function WizardHarness({
    canAdvance,
    onFinish,
}: Readonly<{
    canAdvance?: boolean;
    onFinish?: () => void;
}>): ReactElement {
    const [currentId, setCurrentId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('plan');
    return (
        <Wizard
            label="Convoy setup"
            steps={STEPS}
            currentId={currentId}
            onStepChange={setCurrentId}
            canAdvance={canAdvance}
            onFinish={onFinish}
        />
    );
}

describe('Wizard', (): void => {
    it('presents the current step with Back gated on the first', (): void => {
        render(<WizardHarness />);
        expect(screen.getByText('Plan the route.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    });

    it('walks forward and back through controlled navigation', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<WizardHarness />);
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByText('Load the cargo.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByText('Plan the route.')).toBeInTheDocument();
    });

    it('gates the forward key on canAdvance', (): void => {
        render(<WizardHarness canAdvance={false} />);
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('finishes from the last step', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onFinish: Mock = vi.fn();
        render(<WizardHarness onFinish={onFinish} />);
        await user.click(screen.getByRole('button', { name: 'Next' }));
        await user.click(screen.getByRole('button', { name: 'Next' }));
        const finish: HTMLElement = screen.getByRole('button', {
            name: 'Finish',
        });
        await user.click(finish);
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('renders nothing for an unknown current step', (): void => {
        const view: { container: HTMLElement } = render(
            <Wizard
                label="Convoy setup"
                steps={STEPS}
                currentId="missing"
                onStepChange={(): void => {
                    // Unknown step: navigation can never fire.
                }}
            />,
        );
        expect(view.container).toBeEmptyDOMElement();
    });
});
