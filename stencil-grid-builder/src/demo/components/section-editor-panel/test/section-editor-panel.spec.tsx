import { newSpecPage } from '@stencil/core/testing';
import { SectionEditorPanel } from '../section-editor-panel';
import { SectionEditorData } from '../../../types/section-editor-data';

describe('section-editor-panel', () => {
  let sectionData: SectionEditorData;

  beforeEach(() => {
    sectionData = {
      canvasId: 'test-canvas',
      title: 'Test Section',
      backgroundColor: '#f0f4f8',
    };
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = false;
      await page.waitForChanges();

      const overlay = page.root.querySelector('.section-editor-overlay');
      expect(overlay).toBeNull();
    });

    it('should not render when sectionData is null', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = null;
      await page.waitForChanges();

      const overlay = page.root.querySelector('.section-editor-overlay');
      expect(overlay).toBeNull();
    });

    it('should render when isOpen is true and sectionData is provided', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const overlay = page.root.querySelector('.section-editor-overlay');
      expect(overlay).not.toBeNull();

      const panel = page.root.querySelector('.section-editor-panel');
      expect(panel).not.toBeNull();
    });

    it('should display section title in input', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      expect(titleInput.value).toBe('Test Section');
    });

    it('should display background color in inputs', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      const hexInput = page.root.querySelector('.color-hex-input') as HTMLInputElement;

      expect(colorInput.value).toBe('#f0f4f8');
      expect(hexInput.value).toBe('#f0f4f8');
    });
  });

  describe('Live Title Preview', () => {
    it('should emit previewTitleChange event when title input changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = 'Updated Title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        title: 'Updated Title',
      });
    });

    it('should emit multiple previewTitleChange events as user types', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;

      // Simulate user typing character by character
      titleInput.value = 'N';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      titleInput.value = 'Ne';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      titleInput.value = 'New';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledTimes(3);
      expect(eventSpy.mock.calls[0][0].detail.title).toBe('N');
      expect(eventSpy.mock.calls[1][0].detail.title).toBe('Ne');
      expect(eventSpy.mock.calls[2][0].detail.title).toBe('New');
    });

    it('should not emit previewTitleChange when sectionData is null', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Now remove sectionData
      page.root.sectionData = null;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      // Try to trigger input event (though component should not render)
      // This tests defensive programming
      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      expect(titleInput).toBeNull(); // Should not exist when sectionData is null
    });
  });

  describe('Live Color Preview', () => {
    it('should emit previewColorChange event when color input changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewColorChange', eventSpy);

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      colorInput.value = '#ff0000';
      colorInput.dispatchEvent(new Event('input', { bubbles: true }));
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        backgroundColor: '#ff0000',
      });
    });

    it('should emit previewColorChange when hex input changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewColorChange', eventSpy);

      const hexInput = page.root.querySelector('.color-hex-input') as HTMLInputElement;
      hexInput.value = '#00ff00';
      hexInput.dispatchEvent(new Event('input', { bubbles: true }));
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        backgroundColor: '#00ff00',
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should emit closePanel event when cancel button clicked', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('closePanel', eventSpy);

      const cancelBtn = page.root.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit closePanel event when close button (X) clicked', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('closePanel', eventSpy);

      const closeBtn = page.root.querySelector('.close-btn') as HTMLButtonElement;
      closeBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit previewTitleChange to revert title on cancel', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Change title
      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = 'Modified Title';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      // Cancel
      const cancelBtn = page.root.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await page.waitForChanges();

      // Should emit event to revert to original title
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        title: 'Test Section', // Original title
      });
    });

    it('should emit previewColorChange to revert color on cancel', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Change color
      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      colorInput.value = '#ff0000';
      colorInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewColorChange', eventSpy);

      // Cancel
      const cancelBtn = page.root.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await page.waitForChanges();

      // Should emit event to revert to original color
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        backgroundColor: '#f0f4f8', // Original color
      });
    });

    it('should revert both title and color on cancel after multiple changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Change both title and color
      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = 'New Title';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      colorInput.value = '#00ff00';
      colorInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const titleEventSpy = jest.fn();
      const colorEventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', titleEventSpy);
      page.doc.addEventListener('previewColorChange', colorEventSpy);

      // Cancel
      const cancelBtn = page.root.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await page.waitForChanges();

      // Both should be reverted
      expect(titleEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { canvasId: 'test-canvas', title: 'Test Section' },
        })
      );
      expect(colorEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { canvasId: 'test-canvas', backgroundColor: '#f0f4f8' },
        })
      );
    });
  });

  describe('Save Functionality', () => {
    it('should emit updateSection event when save button clicked', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('updateSection', eventSpy);

      const saveBtn = page.root.querySelector('.save-btn') as HTMLButtonElement;
      saveBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
        title: 'Test Section',
        backgroundColor: '#f0f4f8',
      });
    });

    it('should emit updateSection with modified values', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Modify title and color
      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = 'Modified Title';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      colorInput.value = '#123456';
      colorInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('updateSection', eventSpy);

      const saveBtn = page.root.querySelector('.save-btn') as HTMLButtonElement;
      saveBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            canvasId: 'test-canvas',
            title: 'Modified Title',
            backgroundColor: '#123456',
          },
        })
      );
    });

    it('should emit closePanel after save', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('closePanel', eventSpy);

      const saveBtn = page.root.querySelector('.save-btn') as HTMLButtonElement;
      saveBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Delete Functionality', () => {
    it('should render delete button', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const deleteBtn = page.root.querySelector('.delete-btn') as HTMLButtonElement;
      expect(deleteBtn).not.toBeNull();
      expect(deleteBtn.textContent).toContain('Delete Section');
    });

    it('should emit deleteSection event when delete button clicked', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('deleteSection', eventSpy);

      const deleteBtn = page.root.querySelector('.delete-btn') as HTMLButtonElement;
      deleteBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        canvasId: 'test-canvas',
      });
    });

    it('should emit closePanel after delete', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('closePanel', eventSpy);

      const deleteBtn = page.root.querySelector('.delete-btn') as HTMLButtonElement;
      deleteBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit deleteSection with correct canvasId for different sections', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      const customSectionData = {
        canvasId: 'custom-section-123',
        title: 'Custom Section',
        backgroundColor: '#ffffff',
      };

      page.root.isOpen = true;
      page.root.sectionData = customSectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('deleteSection', eventSpy);

      const deleteBtn = page.root.querySelector('.delete-btn') as HTMLButtonElement;
      deleteBtn.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { canvasId: 'custom-section-123' },
        })
      );
    });
  });

  describe('State Management', () => {
    it('should update editedTitle when sectionData changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      expect(titleInput.value).toBe('Test Section');

      // Change section data
      const newSectionData = {
        canvasId: 'another-canvas',
        title: 'Another Section',
        backgroundColor: '#ffffff',
      };
      page.root.sectionData = newSectionData;
      await page.waitForChanges();

      expect(titleInput.value).toBe('Another Section');
    });

    it('should update editedColor when sectionData changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      expect(colorInput.value).toBe('#f0f4f8');

      // Change section data
      const newSectionData = {
        canvasId: 'another-canvas',
        title: 'Another Section',
        backgroundColor: '#aabbcc',
      };
      page.root.sectionData = newSectionData;
      await page.waitForChanges();

      expect(colorInput.value).toBe('#aabbcc');
    });

    it('should store original values when panel opens', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      // Modify values
      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = 'Changed';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const colorInput = page.root.querySelector('.section-color-input') as HTMLInputElement;
      colorInput.value = '#000000';
      colorInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      // Cancel should revert to originals
      const titleEventSpy = jest.fn();
      const colorEventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', titleEventSpy);
      page.doc.addEventListener('previewColorChange', colorEventSpy);

      const cancelBtn = page.root.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await page.waitForChanges();

      // Should revert to original values
      expect(titleEventSpy.mock.calls[0][0].detail.title).toBe('Test Section');
      expect(colorEventSpy.mock.calls[0][0].detail.backgroundColor).toBe('#f0f4f8');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      titleInput.value = '';
      titleInput.dispatchEvent(new Event('input'));
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('updateSection', eventSpy);

      const saveBtn = page.root.querySelector('.save-btn') as HTMLButtonElement;
      saveBtn.click();
      await page.waitForChanges();

      expect(eventSpy.mock.calls[0][0].detail.title).toBe('');
    });

    it('should handle special characters in title', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;
      const specialTitle = '<script>alert("XSS")</script>';
      titleInput.value = specialTitle;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      await page.waitForChanges();

      // Should emit the special characters as-is (DOM sanitization happens elsewhere)
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.title).toBe(specialTitle);
    });

    it('should handle rapid title changes', async () => {
      const page = await newSpecPage({
        components: [SectionEditorPanel],
        html: `<section-editor-panel></section-editor-panel>`,
      });

      page.root.isOpen = true;
      page.root.sectionData = sectionData;
      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.doc.addEventListener('previewTitleChange', eventSpy);

      const titleInput = page.root.querySelector('.section-title-input') as HTMLInputElement;

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        titleInput.value = `Title ${i}`;
        titleInput.dispatchEvent(new Event('input'));
        await page.waitForChanges();
      }

      expect(eventSpy).toHaveBeenCalledTimes(10);
      expect(eventSpy.mock.calls[9][0].detail.title).toBe('Title 9');
    });
  });
});
