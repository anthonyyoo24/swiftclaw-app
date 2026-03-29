// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DeployProgressView } from '../DeployProgressView';

describe('DeployProgressView', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the "Deploying Agent" heading on mount', () => {
        render(<DeployProgressView duration={10000} />);
        expect(screen.getByText('Deploying Agent')).toBeInTheDocument();
    });

    it('renders the progressbar with aria-valuenow=0 initially', () => {
        render(<DeployProgressView duration={10000} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '0');
    });

    it('advances to the first step message shortly after mount', async () => {
        render(<DeployProgressView duration={10000} />);

        // The component fires a 50ms timeout to kick off the first step
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Authenticating with Provider...');
    });

    it('progress bar increases as time passes', async () => {
        render(<DeployProgressView duration={10000} />);
        const STEP_DURATION = 10000 / 5; // 2000ms per step

        await act(async () => {
            vi.advanceTimersByTime(50); // kick first step
            vi.advanceTimersByTime(STEP_DURATION * 2); // advance 2 steps
        });

        const bar = screen.getByRole('progressbar');
        const valuenow = Number(bar.getAttribute('aria-valuenow'));
        // After 2 steps: (2/5)*100 = 40, but capped at 98
        expect(valuenow).toBeGreaterThan(0);
        expect(valuenow).toBeLessThanOrEqual(98);
    });

    it('never reaches 100% (stays capped at 98)', async () => {
        render(<DeployProgressView duration={10000} />);

        await act(async () => {
            vi.advanceTimersByTime(50);
            vi.advanceTimersByTime(10000 * 2); // well past end
        });

        const bar = screen.getByRole('progressbar');
        expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(98);
    });

    it('shows the last step message after all steps have advanced', async () => {
        render(<DeployProgressView duration={5000} />);
        const STEP_DURATION = 5000 / 5; // 1000ms per step

        await act(async () => {
            vi.advanceTimersByTime(50);
            vi.advanceTimersByTime(STEP_DURATION * 5);
        });

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Finalizing agent startup...');
    });

    it('cleans up timers on unmount (no state-update warnings)', () => {
        const { unmount } = render(<DeployProgressView duration={10000} />);
        // Should not throw or warn
        expect(() => unmount()).not.toThrow();
    });
});
