// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mock Convex React to avoid requiring ConvexProvider ──────────────────────
// Stable references are critical here: useMutation's return value is used in a
// useEffect dependency array — a new function on every render causes an infinite loop.
const { mockRegisterAgents } = vi.hoisted(() => ({
    mockRegisterAgents: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('convex/react', () => ({
    useMutation: () => mockRegisterAgents,
    useQuery: () => [],
}));

// ── Mock heavy UI dependencies ───────────────────────────────────────────────
vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
    Toaster: () => null,
}));

vi.mock('@/hooks/useOnboardingStatus', () => ({
    dispatchOnboardingStatusChanged: vi.fn(),
    useOnboardingStatus: vi.fn(() => ({ isComplete: false })),
}));

// Mock all step sub-components to reduce render complexity
vi.mock('../steps/WelcomeStep', () => ({ WelcomeStep: () => <div data-testid="step-welcome">Welcome</div> }));
vi.mock('../steps/UsageTypeStep', () => ({ UsageTypeStep: () => <div data-testid="step-usage-type">UsageType</div> }));
vi.mock('../steps/UserNameStep', () => ({ UserNameStep: () => <div data-testid="step-user-name">UserName</div> }));
vi.mock('../steps/TimezoneStep', () => ({ TimezoneStep: () => <div data-testid="step-timezone">Timezone</div> }));
vi.mock('../steps/BusinessUseStep', () => ({ BusinessUseStep: () => <div>Business</div> }));
vi.mock('../steps/PersonalContextStep', () => ({ PersonalContextStep: () => <div>Personal</div> }));
vi.mock('../steps/GoalsStep', () => ({ GoalsStep: () => <div>Goals</div> }));
vi.mock('../steps/WorkflowsStep', () => ({ WorkflowsStep: () => <div>Workflows</div> }));
vi.mock('../steps/ToolsStep', () => ({ ToolsStep: () => <div>Tools</div> }));
vi.mock('../steps/CharacterSelectionView', () => ({ CharacterSelectionView: () => <div>Character</div> }));
vi.mock('../steps/AIBrainStep', () => ({ AIBrainStep: () => <div>AIBrain</div> }));
vi.mock('../steps/ChannelSetupStep', () => ({ ChannelSetupStep: () => <div>Channel</div> }));
vi.mock('../steps/DeploymentStep', () => ({ DeploymentStep: () => <div data-testid="step-deploy">Deploy</div> }));
vi.mock('../steps/DeployProgressView', () => ({
    DeployProgressView: () => <div data-testid="step-deploy-progress" />,
}));
vi.mock('../steps/DeploySuccessView', () => ({ DeploySuccessView: () => <div data-testid="step-deploy-success">Success</div> }));
vi.mock('../steps/DeployErrorView', () => ({ DeployErrorView: () => <div data-testid="step-deploy-error">Error</div> }));
vi.mock('../WelcomeIllustration', () => ({ WelcomeIllustration: () => null }));

vi.mock('@/components/ui/wizard/WizardShell', () => ({
    WizardShell: ({ children, onNext, canProgress }: {
        children: React.ReactNode;
        onNext: () => void;
        canProgress: boolean;
    }) => (
        <div>
            {children}
            <button onClick={onNext} disabled={!canProgress} data-testid="btn-next">Next</button>
        </div>
    ),
}));

vi.mock('../schema', async () => {
    const actual = await vi.importActual<typeof import('../schema')>('../schema');
    const alwaysSucceed = { safeParse: (data: unknown) => ({ success: true as const, data }) };
    return {
        ...actual,
        STEP_SCHEMAS: Object.fromEntries(
            Object.keys(actual.STEP_SCHEMAS as Record<string, unknown>).map(k => [k, alwaysSucceed])
        ),
        onboardingSchema: alwaysSucceed,
    };
});

// ── Mock window.electron ─────────────────────────────────────────────────────
const mockSendDeploymentStart = vi.fn();
const mockOnDeploymentSuccess = vi.fn<(cb: () => void) => (() => void)>(() => vi.fn());
const mockOnDeploymentError = vi.fn<(cb: (data: { message?: string }) => void) => (() => void)>(() => vi.fn());
const mockOnDeploymentProgress = vi.fn<(cb: (data: { step: number; label: string }) => void) => (() => void)>(() => vi.fn());

beforeEach(() => {
    mockSendDeploymentStart.mockReset();
    mockOnDeploymentSuccess.mockReset().mockReturnValue(vi.fn());
    mockOnDeploymentError.mockReset().mockReturnValue(vi.fn());
    mockOnDeploymentProgress.mockReset().mockReturnValue(vi.fn());

    Object.defineProperty(window, 'electron', {
        value: {
            ipcRenderer: {
                sendDeploymentStart: mockSendDeploymentStart,
                onDeploymentSuccess: mockOnDeploymentSuccess,
                onDeploymentError: mockOnDeploymentError,
                onDeploymentProgress: mockOnDeploymentProgress,
            },
        },
        writable: true,
        configurable: true,
    });
});

import { SetupWizard } from '../SetupWizard';

describe('SetupWizard component', () => {
    it('renders the welcome step on mount', () => {
        render(<SetupWizard />);
        expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
    });

    it('Next button is enabled on the Welcome step (no validation required)', () => {
        render(<SetupWizard />);
        expect(screen.getByTestId('btn-next')).not.toBeDisabled();
    });

    it('does NOT subscribe to IPC events while in idle deploy state', () => {
        render(<SetupWizard />);
        expect(mockOnDeploymentSuccess).not.toHaveBeenCalled();
        expect(mockOnDeploymentError).not.toHaveBeenCalled();
        expect(mockOnDeploymentProgress).not.toHaveBeenCalled();
    });

    it('does NOT call sendDeploymentStart on initial mount', () => {
        render(<SetupWizard />);
        expect(mockSendDeploymentStart).not.toHaveBeenCalled();
    });
});
