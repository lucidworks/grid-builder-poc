// ========================================
// PERFORMANCE MONITOR
// ========================================
// Tracks FPS, operation timing, and provides visual feedback
// Usage:
//   const monitor = new PerformanceMonitor('variant-name');
//   monitor.startOperation('drag');
//   monitor.endOperation('drag');
//   monitor.measureFrame();

class PerformanceMonitor {
  constructor(variantName = 'unknown') {
    this.variantName = variantName;
    this.fps = 60;
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = performance.now();

    // Operation timing
    this.operations = {
      drag: [],
      resize: [],
      render: [],
      viewport: [],
      add: []
    };
    this.currentOperation = null;
    this.operationStartTime = 0;

    // Stats
    this.stats = {
      minFps: 60,
      maxFps: 60,
      avgFps: 60,
      totalFrames: 0,
      droppedFrames: 0,
      layoutThrashingDetected: 0
    };

    // UI Elements
    this.panel = null;
    this.toggleBtn = null;
    this.isVisible = false;

    // Auto-measure FPS
    this.measureFrame();

    // Create toggle button immediately
    this.createToggleButton();
  }

  // Measure FPS using requestAnimationFrame
  measureFrame() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;

    // Calculate instantaneous FPS (no smoothing for current display)
    const instantFps = Math.round(1000 / delta);
    this.fps = instantFps;

    // Track stats
    this.stats.totalFrames++;
    if (instantFps < 55) {
      this.stats.droppedFrames++;
    }

    // Update min/max/avg every second
    if (now - this.lastFpsUpdate > 1000) {
      // Store current FPS for averaging
      this.fpsHistory.push(instantFps);
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }

      // Track absolute min/max based on instantaneous values
      this.stats.minFps = Math.min(this.stats.minFps, instantFps);
      this.stats.maxFps = Math.max(this.stats.maxFps, instantFps);

      // Calculate smoothed average from history
      this.stats.avgFps = Math.round(
        this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      );

      this.lastFpsUpdate = now;

      // Update UI if visible
      if (this.isVisible) {
        this.updateUI();
      }
    }

    this.lastFrameTime = now;
    this.frameCount++;

    // Update UI more frequently if visible (every ~100ms or ~6 frames)
    if (this.isVisible && this.frameCount % 6 === 0) {
      this.updateUI();
    }

    // Continue measuring
    requestAnimationFrame(() => this.measureFrame());
  }

  // Start timing an operation
  startOperation(type) {
    this.currentOperation = type;
    this.operationStartTime = performance.now();
  }

  // End timing an operation
  endOperation(type) {
    if (this.currentOperation === type) {
      const duration = performance.now() - this.operationStartTime;

      if (!this.operations[type]) {
        this.operations[type] = [];
      }

      this.operations[type].push(duration);

      // Keep only last 20 operations
      if (this.operations[type].length > 20) {
        this.operations[type].shift();
      }

      // Detect layout thrashing (operations taking >16ms)
      if (duration > 16) {
        this.stats.layoutThrashingDetected++;
      }

      this.currentOperation = null;
      this.operationStartTime = 0;
    }
  }

  // Get average operation time
  getAvgOperationTime(type) {
    const ops = this.operations[type] || [];
    if (ops.length === 0) return 0;
    return Math.round(ops.reduce((a, b) => a + b, 0) / ops.length);
  }

  // Get operation stats
  getOperationStats(type) {
    const ops = this.operations[type] || [];
    if (ops.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }

    return {
      count: ops.length,
      avg: Math.round(ops.reduce((a, b) => a + b, 0) / ops.length),
      min: Math.round(Math.min(...ops)),
      max: Math.round(Math.max(...ops))
    };
  }

  // Create toggle button (called immediately in constructor)
  createToggleButton() {
    if (this.toggleBtn) return;

    // Wait for DOM to be ready
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this.createToggleButton());
      return;
    }

    // Add base styles for toggle button
    const style = document.createElement('style');
    style.textContent = `
      .perf-toggle-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        background: #333;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      .perf-toggle-btn:hover {
        background: #555;
      }
    `;
    document.head.appendChild(style);

    // Create toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'perf-toggle-btn';
    this.toggleBtn.textContent = '📊 Performance';
    this.toggleBtn.onclick = () => this.toggleUI();
    document.body.appendChild(this.toggleBtn);
  }

  // Create performance panel UI
  createUI() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.className = 'performance-monitor';
    this.panel.innerHTML = `
      <div class="perf-header">
        <strong>Performance Monitor</strong>
        <span class="perf-variant">${this.variantName}</span>
        <button class="perf-close" onclick="window.perfMonitor.hideUI()">×</button>
      </div>
      <div class="perf-body">
        <div class="perf-section">
          <div class="perf-label">FPS</div>
          <div class="perf-value perf-fps" id="perf-fps">60</div>
          <div class="perf-range">
            <span id="perf-min-fps">60</span> - <span id="perf-max-fps">60</span>
            (avg: <span id="perf-avg-fps">60</span>)
          </div>
        </div>

        <div class="perf-section">
          <div class="perf-label">Frame Stats</div>
          <div class="perf-stats">
            <div>Total: <span id="perf-total-frames">0</span></div>
            <div>Dropped: <span id="perf-dropped-frames">0</span></div>
            <div>Thrashing: <span id="perf-thrashing">0</span></div>
          </div>
        </div>

        <div class="perf-section">
          <div class="perf-label">Operations (ms)</div>
          <table class="perf-ops-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Avg</th>
                <th>Min</th>
                <th>Max</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody id="perf-ops-body">
            </tbody>
          </table>
        </div>

        <div class="perf-actions">
          <button onclick="window.perfMonitor.reset()">Reset Stats</button>
          <button onclick="window.perfMonitor.exportData()">Export Data</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .performance-monitor {
        position: fixed;
        top: 60px;
        right: 20px;
        width: 320px;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
      }

      .perf-header {
        background: #333;
        color: white;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 6px 6px 0 0;
      }

      .perf-variant {
        background: #4A90E2;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 10px;
      }

      .perf-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 1;
      }

      .perf-close:hover {
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
      }

      .perf-body {
        padding: 12px;
        max-height: 500px;
        overflow-y: auto;
      }

      .perf-section {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

      .perf-section:last-child {
        border-bottom: none;
      }

      .perf-label {
        font-weight: bold;
        margin-bottom: 6px;
        color: #666;
      }

      .perf-value {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
      }

      .perf-fps {
        color: #28a745;
      }

      .perf-fps.warning {
        color: #ffc107;
      }

      .perf-fps.danger {
        color: #dc3545;
      }

      .perf-range {
        text-align: center;
        color: #999;
        font-size: 11px;
        margin-top: 4px;
      }

      .perf-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .perf-stats div {
        padding: 6px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .perf-ops-table {
        width: 100%;
        border-collapse: collapse;
      }

      .perf-ops-table th {
        text-align: left;
        padding: 4px;
        background: #f5f5f5;
        font-weight: bold;
      }

      .perf-ops-table td {
        padding: 4px;
        border-bottom: 1px solid #e0e0e0;
      }

      .perf-ops-table tr:last-child td {
        border-bottom: none;
      }

      .perf-ops-table .slow {
        background: #fff3cd;
      }

      .perf-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .perf-actions button {
        flex: 1;
        padding: 8px;
        background: #4A90E2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      }

      .perf-actions button:hover {
        background: #357ABD;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.panel);

    this.panel.style.display = 'none';
  }

  // Update UI with current stats
  updateUI() {
    if (!this.panel) return;

    // Update FPS
    const fpsEl = document.getElementById('perf-fps');
    if (fpsEl) {
      fpsEl.textContent = this.fps;

      // Color coding
      fpsEl.className = 'perf-value perf-fps';
      if (this.fps < 30) {
        fpsEl.classList.add('danger');
      } else if (this.fps < 55) {
        fpsEl.classList.add('warning');
      }
    }

    // Update FPS range
    const minFpsEl = document.getElementById('perf-min-fps');
    const maxFpsEl = document.getElementById('perf-max-fps');
    const avgFpsEl = document.getElementById('perf-avg-fps');

    if (minFpsEl) minFpsEl.textContent = this.stats.minFps;
    if (maxFpsEl) maxFpsEl.textContent = this.stats.maxFps;
    if (avgFpsEl) avgFpsEl.textContent = this.stats.avgFps;

    // Update frame stats
    const totalFramesEl = document.getElementById('perf-total-frames');
    const droppedFramesEl = document.getElementById('perf-dropped-frames');
    const thrashingEl = document.getElementById('perf-thrashing');

    if (totalFramesEl) totalFramesEl.textContent = this.stats.totalFrames;
    if (droppedFramesEl) droppedFramesEl.textContent = this.stats.droppedFrames;
    if (thrashingEl) thrashingEl.textContent = this.stats.layoutThrashingDetected;

    // Update operations table
    const opsBody = document.getElementById('perf-ops-body');
    if (opsBody) {
      opsBody.innerHTML = Object.keys(this.operations)
        .map(type => {
          const stats = this.getOperationStats(type);
          if (stats.count === 0) return '';

          const rowClass = stats.avg > 16 ? 'slow' : '';

          return `
            <tr class="${rowClass}">
              <td>${type}</td>
              <td>${stats.avg}</td>
              <td>${stats.min}</td>
              <td>${stats.max}</td>
              <td>${stats.count}</td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // Show UI
  showUI() {
    if (!this.panel) {
      this.createUI();
    }
    this.panel.style.display = 'block';
    this.isVisible = true;
    this.updateUI();
  }

  // Hide UI
  hideUI() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
    this.isVisible = false;
  }

  // Toggle UI
  toggleUI() {
    if (this.isVisible) {
      this.hideUI();
    } else {
      this.showUI();
    }
  }

  // Reset stats
  reset() {
    this.stats = {
      minFps: 60,
      maxFps: 60,
      avgFps: 60,
      totalFrames: 0,
      droppedFrames: 0,
      layoutThrashingDetected: 0
    };

    this.fpsHistory = [];

    Object.keys(this.operations).forEach(type => {
      this.operations[type] = [];
    });

    this.updateUI();
  }

  // Export data as JSON
  exportData() {
    const data = {
      variant: this.variantName,
      timestamp: new Date().toISOString(),
      fps: {
        current: this.fps,
        min: this.stats.minFps,
        max: this.stats.maxFps,
        avg: this.stats.avgFps,
        history: this.fpsHistory
      },
      frames: {
        total: this.stats.totalFrames,
        dropped: this.stats.droppedFrames,
        droppedPercent: Math.round((this.stats.droppedFrames / this.stats.totalFrames) * 100)
      },
      layoutThrashing: this.stats.layoutThrashingDetected,
      operations: {}
    };

    Object.keys(this.operations).forEach(type => {
      data.operations[type] = this.getOperationStats(type);
    });

    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perf-${this.variantName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('Performance data exported:', data);
  }

  // Log current stats to console
  logStats() {
    console.log('=== Performance Stats ===');
    console.log('Variant:', this.variantName);
    console.log('FPS:', this.fps, `(min: ${this.stats.minFps}, max: ${this.stats.maxFps}, avg: ${this.stats.avgFps})`);
    console.log('Frames:', this.stats.totalFrames, `(dropped: ${this.stats.droppedFrames})`);
    console.log('Layout Thrashing Detected:', this.stats.layoutThrashingDetected);
    console.log('Operations:');
    Object.keys(this.operations).forEach(type => {
      const stats = this.getOperationStats(type);
      if (stats.count > 0) {
        console.log(`  ${type}:`, stats);
      }
    });
  }
}

// Make available globally
window.PerformanceMonitor = PerformanceMonitor;
