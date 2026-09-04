import { useState } from "react";

/** A searchable, selectable dropdown that also allows free-text entry — so you
 *  can pick an existing option or type a brand-new value. Unlike a native
 *  <datalist>, the list is always visible on focus across browsers. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const q = value.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const isNew = q !== "" && !options.some((o) => o.toLowerCase() === q);

  return (
    <div className="combobox">
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (filtered.length > 0 || isNew) && (
        <ul className="combobox-list">
          {isNew && (
            <li>
              <button
                type="button"
                className="combobox-option combobox-new"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}
              >
                Add “{value.trim()}”
              </button>
            </li>
          )}
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                className="combobox-option"
                // mousedown fires before the input's blur, so the click registers.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o);
                  setOpen(false);
                }}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
