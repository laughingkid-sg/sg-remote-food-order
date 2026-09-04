import { useState } from "react";

export type Option = { value: string; label: string };
export type SelectGroup = { label: string | null; options: Option[] };

/** A custom single-select dropdown (no native <select>). Supports optgroup-style
 *  grouping. Closes on select or blur; options use mousedown so the click lands
 *  before the trigger blurs. */
export function SelectMenu({
  id,
  value,
  onChange,
  groups,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  groups: SelectGroup[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = groups.flatMap((g) => g.options).find((o) => o.value === value);

  return (
    <div className="combobox">
      <button
        type="button"
        id={id}
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        <span>{selected ? selected.label : "—"}</span>
        <span className="select-caret">▾</span>
      </button>
      {open && (
        <ul className="combobox-list" role="listbox">
          {groups.map((g, gi) => (
            <li key={gi}>
              {g.label && <div className="combobox-group">{g.label}</div>}
              <ul className="combobox-sublist">
                {g.options.map((o) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      className={
                        "combobox-option" + (o.value === value ? " combobox-selected" : "")
                      }
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onChange(o.value);
                        setOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
