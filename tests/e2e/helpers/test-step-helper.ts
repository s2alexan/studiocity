import { type Page, type TestInfo, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Verification {
  spec: string;
  check: () => Promise<void>;
}

interface StepOptions {
  description: string;
  verifications: Verification[];
}

interface DocStep {
  title: string;
  image: string;
  specs: string[];
}

export async function waitForAnimations(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

export class TestStepHelper {
  private stepCount = 0;
  private steps: DocStep[] = [];
  private metadataTitle = '';
  private metadataDescription = '';

  constructor(
    private page: Page,
    private testInfo: TestInfo,
  ) {}

  setMetadata(title: string, description: string) {
    this.metadataTitle = title;
    this.metadataDescription = description;
  }

  async step(id: string, options: StepOptions) {
    for (const verification of options.verifications) {
      await verification.check();
    }

    const paddedIndex = String(this.stepCount++).padStart(3, '0');
    const filename = `${paddedIndex}-${id.replace(/_/g, '-')}.png`;
    const snapshotName = filename.replace(/\.png$/, '');

    await waitForAnimations(this.page);
    await expect(this.page).toHaveScreenshot(snapshotName);

    this.steps.push({
      title: options.description,
      image: filename,
      specs: options.verifications.map((verification) => verification.spec),
    });
  }

  generateDocs() {
    const testDir = path.dirname(this.testInfo.file);
    const readmePath = path.join(testDir, 'README.md');

    let markdown = `# ${this.metadataTitle || this.testInfo.title}\n\n`;

    if (this.metadataDescription) {
      markdown += `${this.metadataDescription}\n\n`;
    }

    for (const step of this.steps) {
      markdown += `## ${step.title}\n\n`;
      markdown += `![${step.title}](./screenshots/${step.image})\n\n`;
      markdown += `### Verifications\n\n`;
      for (const spec of step.specs) {
        markdown += `- [x] ${spec}\n`;
      }
      markdown += `\n`;
    }

    fs.writeFileSync(readmePath, markdown);
  }
}
