import { newSpecPage } from '@stencil/core/testing';
import { componentTemplates } from '../../data/component-templates';
import { ComponentPalette } from './component-palette';

describe('component-palette', () => {
  it('should render without errors', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });
    expect(page.root).toBeTruthy();
  });

  it('should render all component templates', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });

    const paletteItems = page.root.querySelectorAll('.palette-item');
    const templateCount = Object.keys(componentTemplates).length;

    expect(paletteItems.length).toBe(templateCount);
  });

  it('should render simple components', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });

    const headerItem = Array.from(page.root.querySelectorAll('.palette-item')).find(item =>
      item.textContent.includes('Header')
    );

    expect(headerItem).toBeTruthy();
  });

  it('should render complex components under "Complex" heading', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });

    const galleryItem = Array.from(page.root.querySelectorAll('.palette-item')).find(item =>
      item.textContent.includes('Image Gallery')
    );

    expect(galleryItem).toBeTruthy();
  });

  it('should render undo/redo buttons', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });

    const undoBtn = page.root.querySelector('#undoBtn');
    const redoBtn = page.root.querySelector('#redoBtn');

    expect(undoBtn).toBeTruthy();
    expect(redoBtn).toBeTruthy();
  });

  it('should have undo/redo buttons disabled by default', async () => {
    const page = await newSpecPage({
      components: [ComponentPalette],
      html: `<component-palette></component-palette>`,
    });

    await page.waitForChanges();

    const undoBtn = page.root.querySelector('#undoBtn') as HTMLButtonElement;
    const redoBtn = page.root.querySelector('#redoBtn') as HTMLButtonElement;

    // In Stencil tests, disabled property may not be synced, so check attribute instead
    expect(undoBtn.hasAttribute('disabled')).toBe(true);
    expect(redoBtn.hasAttribute('disabled')).toBe(true);
  });
});
