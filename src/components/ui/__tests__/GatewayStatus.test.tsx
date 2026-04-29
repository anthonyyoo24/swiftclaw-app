// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GatewayStatus, GatewayStatusType } from '../GatewayStatus';

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />
}));

describe('GatewayStatus', () => {
    const statuses: GatewayStatusType[] = ["online", "offline", "connecting", "error"];

    it.each(statuses)('renders the correct label for status "%s"', (status) => {
        const labelMap: Record<GatewayStatusType, string> = {
            online: "Online",
            offline: "Offline",
            connecting: "Connecting",
            error: "Error",
        };
        render(<GatewayStatus status={status} />);
        expect(screen.getByText(labelMap[status])).toBeInTheDocument();
    });

    it('shows retry button when status is "error" and onRetry is provided', () => {
        render(<GatewayStatus status="error" onRetry={vi.fn()} />);
        expect(screen.getByTitle("Retry connection")).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
        const onRetry = vi.fn();
        const user = userEvent.setup();
        render(<GatewayStatus status="error" onRetry={onRetry} />);

        await user.click(screen.getByTitle("Retry connection"));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('does not show retry button when status is "error" but onRetry is not provided', () => {
        render(<GatewayStatus status="error" />);
        expect(screen.queryByTitle("Retry connection")).not.toBeInTheDocument();
    });

    it.each(["online", "offline", "connecting"] as GatewayStatusType[])(
        'does not show retry button for status "%s" even when onRetry is provided',
        (status) => {
            render(<GatewayStatus status={status} onRetry={vi.fn()} />);
            expect(screen.queryByTitle("Retry connection")).not.toBeInTheDocument();
        }
    );
});
