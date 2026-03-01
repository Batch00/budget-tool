// LogoMark — icon only (scalable via size prop)
// LogoFull  — icon + "BatchFlow" wordmark side-by-side
export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BatchFlow logo"
    >
      <rect width="32" height="32" rx="7" fill="#4f46e5" />
      <rect x="4" y="8.5" width="15" height="3" rx="1.5" fill="white" />
      <rect x="4" y="14.5" width="15" height="3" rx="1.5" fill="white" />
      <rect x="4" y="20.5" width="15" height="3" rx="1.5" fill="white" />
      <polyline
        points="22,8.5 28,16 22,23.5"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Used in the sidebar header
export function LogoFull() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={32} />
      <span className="text-lg font-bold text-white tracking-tight">BatchFlow</span>
    </div>
  )
}
