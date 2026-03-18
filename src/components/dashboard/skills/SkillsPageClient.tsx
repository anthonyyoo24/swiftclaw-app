"use client";

import { useState } from "react";
import { SkillsHeader } from "./SkillsHeader";
import { SkillsGrid } from "./SkillsGrid";
import { CreateSkillModal } from "./CreateSkillModal";

/**
 * Client wrapper that owns the modal open/close state and wires up
 * both the "New Skill" header button and the "Create Custom Skill" grid card.
 */
export function SkillsPageClient() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <>
            <SkillsHeader onNewSkill={handleOpenModal} />
            <SkillsGrid onOpenModal={handleOpenModal} />
            <CreateSkillModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </>
    );
}
