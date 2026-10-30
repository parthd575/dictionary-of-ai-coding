export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="progress-fill" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}
