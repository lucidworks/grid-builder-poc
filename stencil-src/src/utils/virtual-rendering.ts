/**
 * Virtual Rendering Utility
 * Lazy-load complex components using IntersectionObserver
 *
 * Purpose: Only initialize complex/heavy components when they become visible
 * This improves initial render performance and reduces memory usage
 */

type ComplexComponentType = 'gallery' | 'dashboard' | 'livedata';

/**
 * Virtual Renderer using IntersectionObserver
 * Observes grid items and initializes complex components when visible
 */
export class VirtualRenderer {
  private observer: IntersectionObserver;
  private visibleItems: Set<string> = new Set();
  private intervalIds: Map<string, number> = new Map();

  constructor() {
    // Create observer with 200px margin (pre-render before entering viewport)
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const itemElement = entry.target as HTMLElement;
          const itemId = itemElement.id;
          const itemType = itemElement.getAttribute('data-item-type') as ComplexComponentType;

          if (entry.isIntersecting) {
            // Item is visible - check if we need to initialize it
            if (!this.visibleItems.has(itemId)) {
              this.visibleItems.add(itemId);
              this.initializeComplexComponent(itemId, itemType);
            }
          } else {
            // Item left viewport - cleanup if needed
            this.visibleItems.delete(itemId);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01, // Trigger when even 1% is visible
      }
    );
  }

  /**
   * Start observing an element for lazy loading
   */
  observe(element: HTMLElement, _itemId: string, itemType: ComplexComponentType): void {
    // Store item type as data attribute for retrieval in observer callback
    element.setAttribute('data-item-type', itemType);
    this.observer.observe(element);
  }

  /**
   * Stop observing an element
   */
  unobserve(itemId: string): void {
    const element = document.getElementById(itemId);
    if (element) {
      this.observer.unobserve(element);
    }

    // Cleanup any intervals
    this.cleanup(itemId);

    this.visibleItems.delete(itemId);
  }

  /**
   * Destroy the virtual renderer
   */
  destroy(): void {
    this.observer.disconnect();

    // Cleanup all intervals
    this.intervalIds.forEach(intervalId => clearInterval(intervalId));
    this.intervalIds.clear();
    this.visibleItems.clear();
  }

  /**
   * Cleanup resources for an item
   */
  private cleanup(itemId: string): void {
    const intervalId = this.intervalIds.get(itemId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(itemId);
    }
  }

  /**
   * Initialize complex component behavior
   * Only called when item becomes visible (via Intersection Observer)
   */
  private initializeComplexComponent(itemId: string, type: ComplexComponentType): void {
    const contentEl = document.getElementById(`${itemId}-content`);
    if (!contentEl) { return; }

    // Check if already initialized (prevent double-init)
    if (contentEl.dataset.initialized === 'true') { return; }
    contentEl.dataset.initialized = 'true';

    switch (type) {
      case 'gallery':
        this.renderGallery(contentEl);
        break;

      case 'dashboard':
        this.renderDashboard(contentEl);
        break;

      case 'livedata':
        this.renderLiveData(contentEl, itemId);
        break;
    }
  }

  /**
   * Render image gallery component
   */
  private renderGallery(contentEl: HTMLElement): void {
    contentEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 100%;">
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 1">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 2">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 3">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 4">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 5">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 6">
        </div>
      </div>
    `;
  }

  /**
   * Render dashboard widget component
   */
  private renderDashboard(contentEl: HTMLElement): void {
    contentEl.innerHTML = `
      <div style="font-size: 11px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px; margin-right: 4px;">
            <div style="font-weight: 600; color: #666;">Users</div>
            <div style="font-size: 16px; font-weight: 700; color: #4A90E2;">2,547</div>
          </div>
          <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px;">
            <div style="font-weight: 600; color: #666;">Revenue</div>
            <div style="font-size: 16px; font-weight: 700; color: #28a745;">$12.4K</div>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 8px; border-radius: 3px; margin-bottom: 6px;">
          <div style="font-weight: 600; margin-bottom: 4px;">Activity Chart</div>
          <div style="display: flex; align-items: flex-end; height: 40px; gap: 2px;">
            <div style="flex: 1; background: #4A90E2; height: 60%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 80%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 40%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 90%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 70%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 85%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 95%;"></div>
          </div>
        </div>
        <div style="font-size: 10px; color: #999;">
          <div>• 24 active sessions</div>
          <div>• 156 page views</div>
          <div>• 89% bounce rate</div>
        </div>
      </div>
    `;
  }

  /**
   * Render live data component (with polling)
   */
  private renderLiveData(contentEl: HTMLElement, itemId: string): void {
    let counter = 0;

    const updateLiveData = () => {
      counter++;
      const temperature = (20 + Math.random() * 10).toFixed(1);
      const cpu = (Math.random() * 100).toFixed(0);
      const memory = (40 + Math.random() * 50).toFixed(0);

      if (contentEl) {
        contentEl.innerHTML = `
          <div style="font-size: 11px;">
            <div style="margin-bottom: 8px; padding: 6px; background: #e3f2fd; border-radius: 3px;">
              <div style="font-weight: 600; color: #1976d2;">🌡️ Temperature</div>
              <div style="font-size: 20px; font-weight: 700; color: #1976d2;">${temperature}°C</div>
            </div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: 600;">CPU</span>
                <span>${cpu}%</span>
              </div>
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #4A90E2; height: 100%; width: ${cpu}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: 600;">Memory</span>
                <span>${memory}%</span>
              </div>
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #28a745; height: 100%; width: ${memory}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="font-size: 10px; color: #999; margin-top: 8px;">
              Updated ${counter} times • Last: ${new Date().toLocaleTimeString()}
            </div>
          </div>
        `;
      }
    };

    // Initial render
    updateLiveData();

    // Poll every 2 seconds
    const intervalId = window.setInterval(updateLiveData, 2000);

    // Store interval ID for cleanup
    this.intervalIds.set(itemId, intervalId);
  }
}
