/**
 * Selector de secciones (tablist) del design system Instic.
 * Usar para alternar vistas dentro de una misma página (p. ej. Usuarios / Ubicaciones).
 *
 * @param {{ id: string, label: string, icon: import('react').ComponentType<{ width?: number, height?: number }> }[]} sections
 * @param {string} activeTab
 * @param {(id: string) => void} onChange
 * @param {string} [ariaLabel]
 */
export default function SectionNav({ sections, activeTab, onChange, ariaLabel = "Secciones" }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-col sm:flex-row gap-1 p-1 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] mb-4"
    >
      {sections.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={[
              "flex flex-1 items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-md text-sm font-medium",
              "transition-[background-color,color,border-color] duration-150 ease-in-out",
              "border cursor-pointer",
              isActive
                ? "bg-[var(--ds-accent)] text-[var(--ds-accent-fg)] border-[var(--ds-accent)]"
                : "bg-transparent text-[var(--ds-muted)] border-transparent hover:bg-[var(--ds-bg)] hover:text-[var(--ds-text)]",
            ].join(" ")}
          >
            <Icon width={16} height={16} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
