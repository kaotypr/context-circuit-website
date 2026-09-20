"use client";

export function VersionSelector({ value, route }: { value: string; route: string }) {
  return (
    <label>
      <span className="sr-only">Documentation version</span>
      <select className="version-select" value={value} onChange={(event) => { window.location.assign(event.target.value); }} aria-label="Documentation version">
        <option value={route}>v{value}</option>
      </select>
    </label>
  );
}
