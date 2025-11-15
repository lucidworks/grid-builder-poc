import { Component, h } from '@stencil/core';
// Use the standard interactjs package import
import interact from 'interactjs';
import { componentTemplates } from '../../data/component-templates';
import { redo, undo, undoRedoState } from '../../services/undo-redo';
import { gridToPixelsX, gridToPixelsY } from '../../utils/grid-calculations';

@Component({
  tag: 'component-palette',
  styleUrl: 'component-palette.css',
  shadow: false,
})
export class ComponentPalette {
  componentWillLoad() {
    // Subscribe to undo/redo state changes
    // The undoRedoState from @stencil/store is already reactive
  }

  componentDidLoad() {
    // Initialize drag functionality for palette items
    this.initializePaletteItems();
  }

  render() {
    const simpleComponents = Object.entries(componentTemplates).filter(([, template]) => !template.complex);

    const complexComponents = Object.entries(componentTemplates).filter(([, template]) => template.complex);

    return (
      <div class="palette">
        <h2>Components</h2>

        {simpleComponents.map(([type, template]) => (
          <div class="palette-item" data-component-type={type} key={type}>
            {template.icon} {template.title}
          </div>
        ))}

        <h2
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #ddd',
          }}
        >
          Complex
        </h2>

        {complexComponents.map(([type, template]) => (
          <div class="palette-item" data-component-type={type} key={type}>
            {template.icon} {template.title}
          </div>
        ))}

        <h2
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #ddd',
          }}
        >
          History
        </h2>

        <div class="history-controls">
          <button
            id="undoBtn"
            class="history-btn"
            title="Undo (Ctrl+Z)"
            disabled={!undoRedoState.canUndo}
            onClick={() => undo()}
          >
            ↶ Undo
          </button>
          <button
            id="redoBtn"
            class="history-btn"
            title="Redo (Ctrl+Y)"
            disabled={!undoRedoState.canRedo}
            onClick={() => redo()}
          >
            ↷ Redo
          </button>
        </div>
      </div>
    );
  }

  private initializePaletteItems() {
    const paletteItems = document.querySelectorAll('.palette-item');

    paletteItems.forEach((element: HTMLElement) => {
      interact(element).draggable({
        inertia: false,
        autoScroll: false,
        listeners: {
          start: (event: any) => {
            event.target.classList.add('dragging-from-palette');

            // Get component type and template
            const componentType = event.target.getAttribute('data-component-type');
            const template = componentTemplates[componentType];

            // Calculate actual component size (default: 10 units wide, 6 units tall)
            // Use canvas1 for width calculation (responsive grid)
            const defaultWidth = 10;
            const defaultHeight = 6;
            const widthPx = gridToPixelsX(defaultWidth, 'canvas1');
            const heightPx = gridToPixelsY(defaultHeight);
            const halfWidth = widthPx / 2;
            const halfHeight = heightPx / 2;

            // Create drag clone with actual component size
            const dragClone = document.createElement('div');
            dragClone.className = 'dragging-clone';
            dragClone.style.position = 'fixed';
            dragClone.style.width = widthPx + 'px';
            dragClone.style.height = heightPx + 'px';
            dragClone.style.left = event.clientX - halfWidth + 'px';
            dragClone.style.top = event.clientY - halfHeight + 'px';
            dragClone.style.padding = '20px 20px 20px 44px';
            dragClone.style.background = 'rgba(74, 144, 226, 0.9)';
            dragClone.style.color = 'white';
            dragClone.style.borderRadius = '4px';
            dragClone.style.pointerEvents = 'none';
            dragClone.style.zIndex = '10000';
            dragClone.innerHTML = `
                <div style="font-weight: 600; color: #fff; margin-bottom: 5px; font-size: 14px;">${template.icon} ${template.title}</div>
              `;
            document.body.appendChild(dragClone);

            // Store clone reference and half dimensions for move event
            (event.target as any)._dragClone = dragClone;
            (event.target as any)._halfWidth = halfWidth;
            (event.target as any)._halfHeight = halfHeight;
          },

          move: (event: any) => {
            const dragClone = (event.target as any)._dragClone;
            const halfWidth = (event.target as any)._halfWidth;
            const halfHeight = (event.target as any)._halfHeight;
            if (dragClone) {
              dragClone.style.left = event.clientX - halfWidth + 'px';
              dragClone.style.top = event.clientY - halfHeight + 'px';
            }
          },

          end: (event: any) => {
            event.target.classList.remove('dragging-from-palette');
            const dragClone = (event.target as any)._dragClone;
            if (dragClone) {
              dragClone.remove();
              delete (event.target as any)._dragClone;
            }
          },
        },
      });
    });
  }
}
