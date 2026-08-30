export function Icon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const paths = {
    home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z" />,
    cart: (
      <>
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M3 4h2l2.2 11h11.3l1.8-7H7" />
      </>
    ),
    box: <path d="M3 8l9-5 9 5-9 5-9-5Zm0 0v8l9 5 9-5V8" />,
    truck: <path d="M3 7h11v10H3V7Zm11 3h5l2 3v4h-7V10ZM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c.5-3 2.8-5 6-5s5.5 2 6 5" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M21 19c-.4-2.4-2-4-4.2-4" />
      </>
    ),
    coins: <path d="M6 7h12M6 12h12M6 17h12M8 4v16M16 4v16" />,
    chart: <path d="M4 20V9m6 11V4m6 16v-7m6 7H2" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a7.7 7.7 0 0 0 .1-6l2-1.1-2-3.5-2.3.7A7.8 7.8 0 0 0 14 3.1L13.5 1h-3L10 3.1A7.8 7.8 0 0 0 6.8 5.1L4.5 4.4 2.5 7.9l2 1.1a7.7 7.7 0 0 0 0 6l-2 1.1 2 3.5 2.3-.7A7.8 7.8 0 0 0 10 20.9l.5 2.1h3l.5-2.1a7.8 7.8 0 0 0 3.2-2l2.3.7 2-3.5-2-1.1Z" />
      </>
    ),
    file: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />,
    tag: <path d="M20 13 11 4H4v7l9 9 7-7Z" />,
    bank: <path d="M3 10h18M5 10v8m14-8v8M3 18h18M12 4 3 10h18L12 4Z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c1-4 3.5-6 7-6s6 2 7 6" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: <path d="m20 20-3.5-3.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    logout: <path d="M15 12H3m12 0-3-3m3 3-3 3M10 5h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
      </>
    ),
    loan: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M8 12h8M8 16h5" />
      </>
    ),
    calc: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </>
    ),
  }
  return <svg {...props}>{paths[name]}</svg>
}
