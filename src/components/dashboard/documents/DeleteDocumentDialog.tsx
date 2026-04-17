"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface DeleteDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentTitle: string;
    onConfirm: () => void;
}

export function DeleteDocumentDialog({
    open,
    onOpenChange,
    documentTitle,
    onConfirm,
}: DeleteDocumentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Delete document?</DialogTitle>
                    <DialogDescription>
                        &ldquo;{documentTitle}&rdquo; will be permanently deleted. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
