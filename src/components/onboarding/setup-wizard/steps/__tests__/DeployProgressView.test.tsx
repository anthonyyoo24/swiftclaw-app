// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DeployProgressView } from '../DeployProgressView';

// Shared default props — backendComplete is false so Phase 1 runs in isolation
const defaultProps = {
    backendComplete: false,
    onVisualComplete: vi.fn(),
};

describe('DeployProgressView', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        defaultProps.onVisualComplete = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the "Deploying Agent" heading on mount', () => {
        render(<DeployProgressView duration={10000} {...defaultProps} />);
        expect(screen.getByText('Deploying Agent')).toBeInTheDocument();
    });

    it('renders the progressbar with aria-valuenow=0 initially', () => {
        render(<DeployProgressView duration={10000} {...defaultProps} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '0');
    });

    it('advances to the first step message shortly after mount', async () => {
        render(<DeployProgressView duration={10000} {...defaultProps} />);

        // The component fires a 50ms timeout to kick off the first step
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Authenticating with Provider...');
    });

    it('progress bar increases as time passes', async () => {
        render(<DeployProgressView duration={10000} {...defaultProps} />);
        const STEP_DURATION = 10000 / 5; // 2000ms per step

        await act(async () => {
            vi.advanceTimersByTime(50); // kick first step
            vi.advanceTimersByTime(STEP_DURATION * 2); // advance 2 steps
        });

        const bar = screen.getByRole('progressbar');
        const valuenow = Number(bar.getAttribute('aria-valuenow'));
        // After 2 steps: (2/5)*100 = 40, capped at 90
        expect(valuenow).toBeGreaterThan(0);
        expect(valuenow).toBeLessThanOrEqual(90);
    });

    it('shows the last step message after all steps have advanced', async () => {
        render(<DeployProgressView duration={5000} {...defaultProps} />);
        const STEP_DURATION = 5000 / 5; // 1000ms per step

        await act(async () => {
            vi.advanceTimersByTime(50);
            vi.advanceTimersByTime(STEP_DURATION * 5);
        });

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Finalizing agent startup...');
    });

    it('holds at 90% once timer finishes and backendComplete is false', async () => {
        const onVisualComplete = vi.fn();
        render(<DeployProgressView duration={5000} backendComplete={false} onVisualComplete={onVisualComplete} />);

        await act(async () => {
            vi.advanceTimersByTime(5000 * 2); // well past all steps
        });

        const bar = screen.getByRole('progressbar');
        expect(Number(bar.getAttribute('aria-valuenow'))).toBe(90);
        expect(onVisualComplete).not.toHaveBeenCalled();
    });

    it('completes to 100% when backendComplete becomes true after timer', async () => {
        const onVisualComplete = vi.fn();
        const { rerender } = render(
            <DeployProgressView duration={5000} backendComplete={false} onVisualComplete={onVisualComplete} />
        );

        // Let Phase 1 run to completion
        await act(async () => {
            vi.advanceTimersByTime(5000 * 2);
        });

        // Signal backend success
        rerender(
            <DeployProgressView duration={5000} backendComplete={true} onVisualComplete={onVisualComplete} />
        );

        // Advance past the 250ms completion animation
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        const bar = screen.getByRole('progressbar');
        expect(Number(bar.getAttribute('aria-valuenow'))).toBe(100);
    });

    it('calls onVisualComplete after the completion animation finishes', async () => {
        const onVisualComplete = vi.fn();
        const { rerender } = render(
            <DeployProgressView duration={5000} backendComplete={false} onVisualComplete={onVisualComplete} />
        );

        await act(async () => {
            vi.advanceTimersByTime(5000 * 2);
        });

        rerender(
            <DeployProgressView duration={5000} backendComplete={true} onVisualComplete={onVisualComplete} />
        );

        // Not yet called before the animation window
        expect(onVisualComplete).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(onVisualComplete).toHaveBeenCalledOnce();
    });

    it('does not complete early when backendComplete arrives mid-Phase 1', async () => {
        const onVisualComplete = vi.fn();
        const STEP_DURATION = 5000 / 5; // 1000ms

        // Start with backendComplete already true
        render(
            <DeployProgressView duration={5000} backendComplete={true} onVisualComplete={onVisualComplete} />
        );

        // Advance only partway through Phase 1
        await act(async () => {
            vi.advanceTimersByTime(50 + STEP_DURATION * 2);
        });

        const bar = screen.getByRole('progressbar');
        const percent = Number(bar.getAttribute('aria-valuenow'));
        // Still in Phase 1 — should not have jumped to 100%
        expect(percent).toBeLessThan(90);
        expect(onVisualComplete).not.toHaveBeenCalled();
    });

    it('cleans up timers on unmount (no state-update warnings)', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { unmount } = render(<DeployProgressView duration={10000} {...defaultProps} />);
        unmount();

        // Advance past full duration + buffer; if cleanup failed, timer callbacks
        // would fire here and attempt state updates on the unmounted component
        vi.advanceTimersByTime(11000);

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
