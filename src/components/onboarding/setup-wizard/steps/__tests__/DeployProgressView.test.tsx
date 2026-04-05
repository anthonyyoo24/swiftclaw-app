// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DeployProgressView } from '../DeployProgressView';

const defaultProps = {
    currentStep: 0,
    totalSteps: 5,
    progressLabel: 'Getting things ready...',
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
        render(<DeployProgressView {...defaultProps} />);
        expect(screen.getByText('Deploying Agent')).toBeInTheDocument();
    });

    it('renders the progressLabel in the status region', () => {
        render(<DeployProgressView {...defaultProps} progressLabel="Connecting your Telegram..." />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Connecting your Telegram...');
    });

    it('renders progress bar with aria-valuenow=0 when currentStep=0', () => {
        render(<DeployProgressView {...defaultProps} currentStep={0} totalSteps={5} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '0');
    });

    it('renders progress bar at 40% when currentStep=2 and totalSteps=5', () => {
        render(<DeployProgressView {...defaultProps} currentStep={2} totalSteps={5} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '40');
    });

    it('renders progress bar at 100% when currentStep equals totalSteps', () => {
        render(<DeployProgressView {...defaultProps} currentStep={5} totalSteps={5} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '100');
    });

    it('updates progress bar when currentStep prop changes', () => {
        const { rerender } = render(<DeployProgressView {...defaultProps} currentStep={1} totalSteps={4} />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '25');

        rerender(<DeployProgressView {...defaultProps} currentStep={3} totalSteps={4} />);
        expect(bar).toHaveAttribute('aria-valuenow', '75');
    });

    it('does not call onVisualComplete while backendComplete is false', async () => {
        const onVisualComplete = vi.fn();
        render(<DeployProgressView {...defaultProps} backendComplete={false} onVisualComplete={onVisualComplete} />);
        await act(async () => { vi.advanceTimersByTime(1000); });
        expect(onVisualComplete).not.toHaveBeenCalled();
    });

    it('calls onVisualComplete ~250ms after backendComplete becomes true', async () => {
        const onVisualComplete = vi.fn();
        const { rerender } = render(
            <DeployProgressView {...defaultProps} backendComplete={false} onVisualComplete={onVisualComplete} />
        );

        rerender(<DeployProgressView {...defaultProps} backendComplete={true} onVisualComplete={onVisualComplete} />);

        // Not yet called before the 250ms animation window
        expect(onVisualComplete).not.toHaveBeenCalled();

        await act(async () => { vi.advanceTimersByTime(300); });
        expect(onVisualComplete).toHaveBeenCalledOnce();
    });

    it('renders progress bar at 100% once backendComplete is true', async () => {
        const { rerender } = render(
            <DeployProgressView {...defaultProps} currentStep={3} totalSteps={5} backendComplete={false} />
        );

        rerender(<DeployProgressView {...defaultProps} currentStep={3} totalSteps={5} backendComplete={true} />);

        await act(async () => { vi.advanceTimersByTime(300); });

        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '100');
    });

    it('does not call onVisualComplete multiple times if backendComplete stays true', async () => {
        const onVisualComplete = vi.fn();
        const { rerender } = render(
            <DeployProgressView {...defaultProps} backendComplete={true} onVisualComplete={onVisualComplete} />
        );

        await act(async () => { vi.advanceTimersByTime(300); });
        rerender(<DeployProgressView {...defaultProps} backendComplete={true} onVisualComplete={onVisualComplete} />);
        await act(async () => { vi.advanceTimersByTime(300); });

        expect(onVisualComplete).toHaveBeenCalledOnce();
    });

    it('sets aria-valuetext to progressLabel', () => {
        render(<DeployProgressView {...defaultProps} progressLabel="Bringing Maya online..." />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuetext', 'Bringing Maya online...');
    });
});
