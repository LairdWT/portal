import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Select } from './Select';
import { type SelectOption, type SelectProps } from './Select.types';

const OPTIONS: readonly SelectOption[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'date', label: 'Date' },
];

const LONG_OPTIONS: readonly SelectOption[] = [
    { id: 'mercury', label: 'Mercury' },
    { id: 'venus', label: 'Venus' },
    { id: 'earth', label: 'Earth' },
    { id: 'mars', label: 'Mars' },
    { id: 'jupiter', label: 'Jupiter' },
    { id: 'saturn', label: 'Saturn' },
    { id: 'uranus', label: 'Uranus' },
    { id: 'neptune', label: 'Neptune' },
];

const DISABLED_OPTION: readonly SelectOption[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana', disabled: true },
    { id: 'cherry', label: 'Cherry' },
];

// A controlled wrapper the stories share: Select is controlled, so the story
// owns the selected id and feeds it back, the pattern a consumer wiring it to
// app state uses.
function ControlledSelect(args: Omit<SelectProps, 'onChange'>): ReactElement {
    const [value, setValue]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(args.value);
    return <Select {...args} value={value} onChange={setValue} />;
}

// Opens the listbox on mount (by clicking the rendered combobox) so axe
// evaluates the open listbox and its option rows in the storybook browser.
function OpenSelect(args: Omit<SelectProps, 'onChange'>): ReactElement {
    const containerRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    useEffect((): void => {
        const trigger: Element | null | undefined =
            containerRef.current?.querySelector('button[role="combobox"]');
        if (trigger instanceof HTMLElement) {
            trigger.click();
        }
    }, []);
    return (
        <div ref={containerRef}>
            <ControlledSelect {...args} />
        </div>
    );
}

const meta: Meta<typeof Select> = {
    title: 'UI/Select',
    component: Select,
    args: {
        label: 'Fruit',
        options: OPTIONS,
        value: 'banana',
    },
    render: (args: SelectProps): ReactElement => <ControlledSelect {...args} />,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
    args: { value: null, placeholder: 'Choose a fruit' },
};

export const Open: Story = {
    render: (args: SelectProps): ReactElement => <OpenSelect {...args} />,
};

export const Clearable: Story = {
    args: { clearable: true },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const DisabledOption: Story = {
    args: { options: DISABLED_OPTION, value: 'apple' },
};

// onChange is optional: a controlled value with no handler is a legitimate
// read-only display. The trigger shows the selected label and never advances.
export const ReadOnlyValue: Story = {
    render: (): ReactElement => (
        <Select label="Fruit" options={OPTIONS} value="cherry" />
    ),
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const LongList: Story = {
    args: { label: 'Planet', options: LONG_OPTIONS, value: 'earth' },
};

export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-4)' }}>
            <ControlledSelect label="Fruit" options={OPTIONS} value="apple" />
            <ControlledSelect label="Planet" options={LONG_OPTIONS} value="mars" />
        </div>
    ),
};
