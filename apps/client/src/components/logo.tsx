
type LogoProps = {
    className?: string
}

export function Logo({ className }: LogoProps) {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Supaboard Logo" className={className}>
            <title>Supaboard Logo</title>
            <rect x="8.11111" y="5" width="31.2444" height="7.03704" fill="currentColor" />
            <rect x="15.1481" y="20.4815" width="17.1704" height="7.03704" fill="currentColor" />
            <rect x="8.11111" y="12.037" width="7.03704" height="7.03704" fill="currentColor" />
            <rect x="32.3185" y="28.9259" width="7.03704" height="7.03704" fill="currentColor" />
            <rect x="8.11111" y="35.963" width="31.2444" height="7.03704" fill="currentColor" />
        </svg>

    )
}