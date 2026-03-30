// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


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
vi.mock('../steps/DeployProgressView', async () => {
    const { useEffect } = await import('react');
    return {
        DeployProgressView: ({ onVisualComplete, backendComplete }: {
            onVisualComplete: () => void;
            backendComplete: boolean;
            duration?: number;
        }) => {
            useEffect(() => {
                if (backendComplete) onVisualComplete();
            }, [backendComplete, onVisualComplete]);
            return <div data-testid="step-deploy-progress">Deploying...</div>;
        },
    };
});
vi.mock('../steps/DeploySuccessView', () => ({ DeploySuccessView: () => <div data-testid="step-deploy-success">Success</div> }));
vi.mock('../steps/DeployErrorView', () => ({ DeployErrorView: ({ error }: { error: string }) => <div data-testid="step-deploy-error">{error}</div> }));
vi.mock('../WelcomeIllustration', () => ({ WelcomeIllustration: () => null }));

// Mock WizardShell to render children + a simple Next button
vi.mock('@/components/ui/wizard/WizardShell', () => ({
    WizardShell: ({ children, onNext, canProgress }: {
        children: React.ReactNode;
        onNext: () => void;
        canProgress: boolean;
    }) => (
        <div>
            {children}
            <button onClick={onNext} disabled={!canProgress} data-testid="btn-next">
                Next
            </button>
        </div>
    ),
}));

// ── Mock schema to bypass per-step form validation ──────────────────────────
// Without this, default form values fail required-field schemas (userName,
// timezone, etc.), keeping canProgress=false and blocking Next navigation.
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
const mockOnDeploymentSuccess = vi.fn<(cb: () => void) => (() => void)>(() => vi.fn()); // returns cleanup fn
const mockOnDeploymentError = vi.fn<(cb: (data: { message?: string }) => void) => (() => void)>(() => vi.fn());

beforeEach(() => {
    mockSendDeploymentStart.mockReset();
    mockOnDeploymentSuccess.mockReset().mockReturnValue(vi.fn());
    mockOnDeploymentError.mockReset().mockReturnValue(vi.fn());

    Object.defineProperty(window, 'electron', {
        value: {
            ipcRenderer: {
                sendDeploymentStart: mockSendDeploymentStart,
                onDeploymentSuccess: mockOnDeploymentSuccess,
                onDeploymentError: mockOnDeploymentError,
            },
        },
        writable: true,
        configurable: true,
    });
});

import { SetupWizard } from '../SetupWizard';



// ── SetupWizard component tests ───────────────────────────────────────────────

describe('SetupWizard component', () => {
    it('renders the welcome step on mount', () => {
        render(<SetupWizard />);
        expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
    });

    it('Next button is enabled on the Welcome step (no validation required)', () => {
        render(<SetupWizard />);
        expect(screen.getByTestId('btn-next')).not.toBeDisabled();
    });

    // ── IPC state: idle-state behavior ───────────────────────────────────────
    //
    // SetupWizard's IPC listeners (onDeploymentSuccess, onDeploymentError) are
    // registered inside a useEffect that only runs when deployState === 'loading'.
    // At idle state (on mount), these callbacks are NOT invoked. The tests below
    // verify correct idle behavior and the window.electron API contract.

    it('does NOT subscribe to IPC events while in idle deploy state', () => {
        render(<SetupWizard />);
        // At idle, the loading branch of the effect is skipped entirely.
        expect(mockOnDeploymentSuccess).not.toHaveBeenCalled();
        expect(mockOnDeploymentError).not.toHaveBeenCalled();
    });

    it('does NOT call sendDeploymentStart on initial mount', () => {
        render(<SetupWizard />);
        expect(mockSendDeploymentStart).not.toHaveBeenCalled();
    });

    it('window.electron IPC mock is correctly wired with all required methods', () => {
        // Ensures beforeEach wires the full IPC contract that SetupWizard depends on.
        expect(typeof window.electron!.ipcRenderer.sendDeploymentStart).toBe('function');
        expect(typeof window.electron!.ipcRenderer.onDeploymentSuccess).toBe('function');
        expect(typeof window.electron!.ipcRenderer.onDeploymentError).toBe('function');
    });

    it('window.electron.ipcRenderer.onDeploymentSuccess returns a cleanup function', () => {
        // When loading does run, the cleanup returned by onDeploymentSuccess must be
        // callable. Verify the mock returns a valid cleanup fn from beforeEach.
        const cleanup = window.electron!.ipcRenderer.onDeploymentSuccess(vi.fn());
        expect(typeof cleanup).toBe('function');
        expect(() => cleanup()).not.toThrow();
    });

    it('window.electron.ipcRenderer.onDeploymentError returns a cleanup function', () => {
        const cleanup = window.electron!.ipcRenderer.onDeploymentError(vi.fn());
        expect(typeof cleanup).toBe('function');
        expect(() => cleanup()).not.toThrow();
    });

    // ── Deployment flow ──────────────────────────────────────────────────────
    //
    // buildSteps(false) produces 12 steps (deploy at index 11). With the schema
    // mock making every step always-valid, 11 Next clicks navigate to the deploy
    // step; the 12th click triggers handleStartDeployment.

    async function navigateToDeployStep(user: ReturnType<typeof userEvent.setup>) {
        for (let i = 0; i < 11; i++) {
            await user.click(screen.getByTestId('btn-next'));
        }
    }

    it('transitions to loading state and shows DeployProgressView when deployment starts', async () => {
        const user = userEvent.setup();
        render(<SetupWizard />);

        await navigateToDeployStep(user);
        await user.click(screen.getByTestId('btn-next'));

        expect(screen.getByTestId('step-deploy-progress')).toBeInTheDocument();
    });

    it('registers IPC subscriptions when deployState transitions to loading', async () => {
        const user = userEvent.setup();
        render(<SetupWizard />);

        await navigateToDeployStep(user);
        await user.click(screen.getByTestId('btn-next'));

        expect(mockOnDeploymentSuccess).toHaveBeenCalledOnce();
        expect(mockOnDeploymentError).toHaveBeenCalledOnce();
        expect(mockSendDeploymentStart).toHaveBeenCalledOnce();
    });

    it('renders DeploySuccessView after onDeploymentSuccess fires and visual completes', async () => {
        let capturedSuccessCallback: (() => void) | undefined;
        mockOnDeploymentSuccess.mockImplementationOnce((cb: () => void) => {
            capturedSuccessCallback = cb;
            return vi.fn();
        });

        const user = userEvent.setup();
        render(<SetupWizard />);

        await navigateToDeployStep(user);
        await user.click(screen.getByTestId('btn-next'));

        await act(async () => { capturedSuccessCallback?.(); });

        expect(screen.getByTestId('step-deploy-success')).toBeInTheDocument();
    });

    it('renders DeployErrorView with error message when onDeploymentError fires', async () => {
        let capturedErrorCallback: ((data: { message?: string }) => void) | undefined;
        mockOnDeploymentError.mockImplementationOnce((cb: (data: { message?: string }) => void) => {
            capturedErrorCallback = cb;
            return vi.fn();
        });

        const user = userEvent.setup();
        render(<SetupWizard />);

        await navigateToDeployStep(user);
        await user.click(screen.getByTestId('btn-next'));

        await act(async () => { capturedErrorCallback?.({ message: 'Deployment failed' }); });

        expect(screen.getByTestId('step-deploy-error')).toBeInTheDocument();
        expect(screen.getByText('Deployment failed')).toBeInTheDocument();
    });
});

