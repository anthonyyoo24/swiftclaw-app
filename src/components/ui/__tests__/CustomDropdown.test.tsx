// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDropdown, DropdownOption } from '../CustomDropdown';

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />
}));

const OPTIONS: DropdownOption[] = [
    { id: "apple", label: "Apple" },
    { id: "banana", label: "Banana" },
    { id: "cherry", label: "Cherry" },
];

describe('CustomDropdown', () => {
    it('shows placeholder when no value is selected', () => {
        render(<CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} placeholder="Pick a fruit" />);
        expect(screen.getByText("Pick a fruit")).toBeInTheDocument();
    });

    it('shows selected option label when value matches an option', () => {
        render(<CustomDropdown options={OPTIONS} value="banana" onChange={vi.fn()} />);
        expect(screen.getByText("Banana")).toBeInTheDocument();
    });

    it('opens dropdown list on button click', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} />);

        expect(screen.queryByText("Apple")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button"));
        expect(screen.getByText("Apple")).toBeInTheDocument();
        expect(screen.getByText("Banana")).toBeInTheDocument();
        expect(screen.getByText("Cherry")).toBeInTheDocument();
    });

    it('calls onChange with the selected option id on click', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<CustomDropdown options={OPTIONS} value="" onChange={onChange} />);

        await user.click(screen.getByRole("button"));
        await user.click(screen.getByText("Banana"));

        expect(onChange).toHaveBeenCalledWith("banana");
    });

    it('closes dropdown after an option is selected', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} />);

        await user.click(screen.getByRole("button"));
        expect(screen.getByText("Apple")).toBeInTheDocument();

        await user.click(screen.getByText("Banana"));
        await waitFor(() => expect(screen.queryByText("Apple")).not.toBeInTheDocument());
    });

    it('applies maxHeight style to list container when maxItems is set', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} maxItems={2} />);

        await user.click(screen.getByRole("button"));

        // maxHeight for default size: 40 * 2 + 2 * (2-1) + 12 = 94
        const expectedMaxHeight = 40 * 2 + 2 * (2 - 1) + 12;
        const list = document.querySelector('.overflow-y-auto') as HTMLElement;
        expect(list?.style.maxHeight).toBe(`${expectedMaxHeight}px`);
    });

    it('does not apply maxHeight style when maxItems is not set', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} />);

        await user.click(screen.getByRole("button"));

        const list = document.querySelector('.overflow-y-auto') as HTMLElement;
        expect(list?.style.maxHeight).toBe('');
    });

    it('closes on outside click', async () => {
        const user = userEvent.setup();
        render(
            <div>
                <CustomDropdown options={OPTIONS} value="" onChange={vi.fn()} />
                <button>Outside</button>
            </div>
        );

        // First button is the dropdown toggle, second is "Outside"
        await user.click(screen.getAllByRole("button")[0]);
        expect(screen.getByText("Apple")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /outside/i }));
        await waitFor(() => expect(screen.queryByText("Apple")).not.toBeInTheDocument());
    });
});
