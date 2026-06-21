import { describe, expect, it } from 'vitest';

import {
    type BindingResolution,
    createRegistry,
    detectConflicts,
    EBindingConflictKind,
    type FBindingConflict,
    type FInputBinding,
    type IInputBindingRegistry,
    InputBindingRegistry,
    serializeBindings,
} from './InputBinding';

describe('InputBindingRegistry', (): void => {
    it('resolves a bound input to its action', (): void => {
        const registry: IInputBindingRegistry = createRegistry([
            { inputId: 'fire', actionId: 'weapon.primary' },
        ]);

        const resolution: BindingResolution = registry.resolve('fire');

        expect(resolution.actionId).toBe('weapon.primary');
    });

    it('resolves an unbound input to a null action', (): void => {
        const registry: IInputBindingRegistry = createRegistry([]);

        expect(registry.resolve('fire').actionId).toBeNull();
    });

    it('prefers a context-specific binding and falls back to the global one', (): void => {
        const registry: IInputBindingRegistry = createRegistry([
            { inputId: 'select', actionId: 'ui.confirm' },
            { inputId: 'select', actionId: 'ship.deploy', context: 'gameplay' },
        ]);

        expect(registry.resolve('select', 'gameplay').actionId).toBe('ship.deploy');
        expect(registry.resolve('select', 'menu').actionId).toBe('ui.confirm');
        expect(registry.resolve('select').actionId).toBe('ui.confirm');
    });

    it('returns the inputs bound to an action', (): void => {
        const registry: IInputBindingRegistry = createRegistry([
            { inputId: 'fire', actionId: 'weapon.primary' },
            { inputId: 'altFire', actionId: 'weapon.primary', context: 'gameplay' },
            { inputId: 'jump', actionId: 'move.jump' },
        ]);

        const bound: readonly FInputBinding[] =
            registry.bindingsFor('weapon.primary');

        expect(bound).toHaveLength(2);
        expect(
            bound.map((binding: FInputBinding): string => binding.inputId),
        ).toEqual(['fire', 'altFire']);
    });

    it('returns a new registry from each mutator and leaves the original intact', (): void => {
        const base: IInputBindingRegistry = createRegistry([
            { inputId: 'fire', actionId: 'weapon.primary' },
        ]);

        const added: IInputBindingRegistry = base.withBinding({
            inputId: 'jump',
            actionId: 'move.jump',
        });
        const rebound: IInputBindingRegistry = base.rebind(
            'fire',
            'weapon.special',
        );
        const removed: IInputBindingRegistry = base.withoutInput('fire');

        expect(base.list()).toHaveLength(1);
        expect(base.resolve('fire').actionId).toBe('weapon.primary');
        expect(added.resolve('jump').actionId).toBe('move.jump');
        expect(rebound.resolve('fire').actionId).toBe('weapon.special');
        expect(removed.resolve('fire').actionId).toBeNull();
    });

    it('detects duplicate-input and duplicate-action conflicts within a context', (): void => {
        const conflicts: readonly FBindingConflict[] = detectConflicts([
            { inputId: 'fire', actionId: 'weapon.primary' },
            { inputId: 'fire', actionId: 'weapon.special' },
            { inputId: 'altFire', actionId: 'weapon.primary' },
        ]);

        const kinds: readonly EBindingConflictKind[] = conflicts.map(
            (conflict: FBindingConflict): EBindingConflictKind => conflict.kind,
        );
        expect(kinds).toContain(EBindingConflictKind.DuplicateInput);
        expect(kinds).toContain(EBindingConflictKind.DuplicateAction);
    });

    it('treats the same input in different contexts as conflict-free', (): void => {
        const conflicts: readonly FBindingConflict[] = detectConflicts([
            { inputId: 'select', actionId: 'ui.confirm', context: 'menu' },
            { inputId: 'select', actionId: 'ship.deploy', context: 'gameplay' },
        ]);

        expect(conflicts).toHaveLength(0);
    });

    it('round-trips through serializeBindings and createRegistry', (): void => {
        const registry: IInputBindingRegistry = createRegistry([
            { inputId: 'fire', actionId: 'weapon.primary' },
            { inputId: 'select', actionId: 'ship.deploy', context: 'gameplay' },
        ]);

        const restored: IInputBindingRegistry = createRegistry(
            serializeBindings(registry),
        );

        expect(restored.list()).toEqual(registry.list());
    });

    it('throws when a binding is missing an id', (): void => {
        expect(
            (): IInputBindingRegistry =>
                createRegistry([{ inputId: '', actionId: 'weapon.primary' }]),
        ).toThrow();
        expect(
            (): IInputBindingRegistry =>
                new InputBindingRegistry([{ inputId: 'fire', actionId: '' }]),
        ).toThrow();
    });
});
