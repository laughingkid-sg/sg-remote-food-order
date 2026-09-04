import { useState } from "react";

/** A searchable multi-select dropdown that also accepts free-text entries. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const selectedNames = new Set(value.map((name) => name.toLowerCase()));
  const filtered = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options).filter(
    (option) => !selectedNames.has(option.toLowerCase()),
  );
  const isNew = q !== "" && !selectedNames.has(q) && !options.some((o) => o.toLowerCase() === q);

  function add(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed || selectedNames.has(trimmed.toLowerCase())) return;
    const existingOption = options.find(
      (option) => option.toLowerCase() === trimmed.toLowerCase(),
    );
    onChange([...value, existingOption ?? trimmed]);
    setQuery("");
    setOpen(false);
  }

  function remove(name: string) {
    onChange(value.filter((item) => item !== name));
  }

  return (
    <div className="combobox">
      <div className="combobox-input">
        {value.map((name) => (
          <span key={name} className="combobox-chip">
            {name}
            <button
              type="button"
              className="combobox-chip-remove"
              onClick={() => remove(name)}
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={query}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              add(query);
            } else if (e.key === "Backspace" && !query && value.length > 0) {
              remove(value[value.length - 1]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && (filtered.length > 0 || isNew) && (
        <ul className="combobox-list">
          {isNew && (
            <li>
              <button
                type="button"
                className="combobox-option combobox-new"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(query);
                }}
              >
                Add “{query.trim()}”
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
                  add(o);
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
