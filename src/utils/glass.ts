export type Legibility = { bgAlpha: number; text: 'light' | 'dark' };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function glassLegibility(backdropLuminance: number): Legibility {
    const base = 0.08;
    let bgAlpha = base;
    let text: 'light' | 'dark' = 'light';
    if (backdropLuminance > 0.75) {
        bgAlpha += 0.06;
        text = 'dark';
    } else if (backdropLuminance < 0.25) {
        bgAlpha -= 0.02;
        text = 'light';
    }
    return {
        bgAlpha: clamp(bgAlpha, 0.06, 0.18),
        text
    };
}

export function initBackdropSupport() {
    if (typeof document === 'undefined') return;

    // Chrome has stricter policies - check multiple ways
    const supportsBackdrop =
        CSS.supports('backdrop-filter', 'blur(1px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
        // Chrome sometimes blocks backdrop-filter on certain elements
        (typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'blur(1px)'));

    // Set data attribute for CSS fallbacks
    document.documentElement.dataset.backdrop = supportsBackdrop ? 'on' : 'off';

    // If backdrop-filter is blocked, also check if we're in a secure context
    if (!supportsBackdrop && typeof window !== 'undefined') {
        const isSecure = window.isSecureContext;
        if (!isSecure) {
            console.warn('DepthLens: backdrop-filter blocked - not in secure context');
        }
    }
}
