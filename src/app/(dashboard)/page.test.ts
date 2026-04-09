import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { loadRoleEmojis } from "./page";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soul-templates-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeTemplate(filename: string, content: string) {
  fs.writeFileSync(path.join(tmpDir, filename), content, "utf8");
}

describe("loadRoleEmojis", () => {
  it("returns role→emoji map from valid frontmatter", () => {
    writeTemplate("kevin_developer.md", `---\nname: Kevin\nrole: Software Engineer\nemoji: 🖥️\n---\n# Kevin`);
    writeTemplate("maya_support.md", `---\nname: Maya\nrole: Customer Support Specialist\nemoji: 💬\n---\n# Maya`);

    expect(loadRoleEmojis(tmpDir)).toEqual({
      "Software Engineer": "🖥️",
      "Customer Support Specialist": "💬",
    });
  });

  it("skips files missing role", () => {
    writeTemplate("no_role.md", `---\nname: Ghost\nemoji: 👻\n---\n# Ghost`);
    expect(loadRoleEmojis(tmpDir)).toEqual({});
  });

  it("skips files missing emoji", () => {
    writeTemplate("no_emoji.md", `---\nname: Ghost\nrole: QA Engineer\n---\n# Ghost`);
    expect(loadRoleEmojis(tmpDir)).toEqual({});
  });

  it("skips files with no frontmatter", () => {
    writeTemplate("no_frontmatter.md", `# Just a heading\nNo frontmatter here.`);
    expect(loadRoleEmojis(tmpDir)).toEqual({});
  });

  it("skips non-.md files", () => {
    writeTemplate("config.json", `{"role": "Hacker", "emoji": "💀"}`);
    expect(loadRoleEmojis(tmpDir)).toEqual({});
  });

  it("returns empty object for empty directory", () => {
    expect(loadRoleEmojis(tmpDir)).toEqual({});
  });
});
