import { type RefObject, useId, useRef } from 'react';
import { Icon } from './icon';

export interface ActionMenuItem {
  readonly label: string;
  /** Nom complet lu par les lecteurs d'écran, qui précise l'objet de l'action. */
  readonly accessibleName: string;
  readonly isDestructive?: boolean;
  readonly select: () => void;
}

interface ActionMenuProps {
  readonly label: string;
  readonly items: readonly ActionMenuItem[];
  /** Bouton d'ouverture, pour que le parent y rende le focus après l'action. */
  readonly triggerReference?: RefObject<HTMLButtonElement | null>;
}

/**
 * Actions secondaires rangées derrière un bouton « … ». Le navigateur referme le menu par Échap ou
 * par un clic ailleurs.
 */
export function ActionMenu({ label, items, triggerReference }: ActionMenuProps) {
  const menuId = useId();
  const menuReference = useRef<HTMLDivElement>(null);
  const ownTriggerReference = useRef<HTMLButtonElement>(null);
  const trigger = triggerReference ?? ownTriggerReference;
  const choose = (item: ActionMenuItem) => {
    menuReference.current?.hidePopover();
    // Le focus revient au bouton avant l'action : une fenêtre ouverte ensuite le lui rendra.
    trigger.current?.focus();
    item.select();
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        popoverTarget={menuId}
        aria-label={label}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted transition-[background-color,color,scale] hover:bg-ink/6 hover:text-ink motion-safe:active:scale-95 motion-reduce:transition-none"
      >
        <Icon name="more" />
      </button>
      <div
        ref={menuReference}
        id={menuId}
        popover="auto"
        className="action-menu min-w-48 rounded-card border-0 bg-surface p-1.5 text-ink shadow-overlay"
      >
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                aria-label={item.accessibleName}
                onClick={() => choose(item)}
                className={`flex h-11 w-full cursor-pointer items-center rounded-control px-3 text-left font-medium transition-colors hover:bg-ink/6 motion-reduce:transition-none ${item.isDestructive ? 'text-danger' : ''}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
