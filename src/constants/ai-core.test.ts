import { describe, it, expect } from 'vitest';
import { AGENT_ROLES } from './ai-core';

const EXPECTED_AGENTS = ["maya", "jack", "lily", "max", "sarah", "emma", "chris", "kevin", "zoe"];

describe('AGENT_ROLES', () => {
    it('contains all 9 expected agents', () => {
        for (const name of EXPECTED_AGENTS) {
            expect(AGENT_ROLES).toHaveProperty(name);
        }
    });

    it('has no extra or missing agents', () => {
        expect(Object.keys(AGENT_ROLES)).toHaveLength(EXPECTED_AGENTS.length);
    });

    it.each(EXPECTED_AGENTS)('"%s" has required displayName, role, and avatar fields', (name) => {
        const entry = AGENT_ROLES[name];
        expect(entry.displayName).toBeTruthy();
        expect(entry.role).toBeTruthy();
        expect(entry.avatar).toBeTruthy();
    });

    it.each(EXPECTED_AGENTS)('"%s" avatar path starts with /avatars/', (name) => {
        expect(AGENT_ROLES[name].avatar).toMatch(/^\/avatars\//);
    });
});
