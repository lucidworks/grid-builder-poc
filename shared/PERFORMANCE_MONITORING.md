# Performance Monitoring Guide

## Overview

The Performance Monitor provides real-time FPS tracking, operation timing, and visual feedback for measuring grid builder performance.

## Features

- **Real-time FPS Counter** - Tracks current, min, max, and average FPS
- **Operation Timing** - Measures drag, resize, viewport switch, add, and render operations
- **Layout Thrashing Detection** - Flags operations taking >16ms (1 frame)
- **Visual UI Panel** - Toggleable overlay with all metrics
- **Data Export** - Download performance data as JSON for comparison

## Usage

### 1. Include the Script

```html
<script src="../shared/performance-monitor.js"></script>
```

### 2. Initialize the Monitor

```javascript
// Initialize Performance Monitor
const perfMonitor = new PerformanceMonitor('variant-name');
window.perfMonitor = perfMonitor; // Make globally accessible
```

### 3. Instrument Operations

Wrap operations you want to measure:

```javascript
function makeItemDraggable(element, item) {
  interact(element)
    .draggable({
      listeners: {
        start(event) {
          perfMonitor.startOperation('drag');
          // ... existing code
        },

        end(event) {
          // ... existing code
          perfMonitor.endOperation('drag');
        }
      }
    });
}
```

### 4. Access the UI

Click the **"📊 Performance"** button in the top-right corner to open the performance panel.

## UI Components

### Performance Panel

The panel shows:

1. **FPS Section**
   - Current FPS (color-coded: green >55, yellow 30-55, red <30)
   - Min/Max/Average FPS over last 10 seconds

2. **Frame Stats**
   - Total frames rendered
   - Dropped frames (FPS <55)
   - Layout thrashing events (operations >16ms)

3. **Operations Table**
   - Average, min, max, and count for each operation type
   - Rows highlighted yellow if avg >16ms (slow)

4. **Actions**
   - **Reset Stats** - Clear all metrics and start fresh
   - **Export Data** - Download JSON file with all performance data

## Instrumented Operations

### Virtual Variant

- `drag` - Drag item from start to end
- `resize` - Resize item from start to end
- `viewport` - Switch between desktop/mobile view
- `add` - Add items (stress test)
- `render` - Batch render items to DOM

## API Reference

### PerformanceMonitor Class

#### Constructor
```javascript
new PerformanceMonitor(variantName)
```

#### Methods

**startOperation(type)**
- Start timing an operation
- `type`: String ('drag', 'resize', 'viewport', 'add', 'render')

**endOperation(type)**
- End timing an operation
- Must match the type from startOperation

**showUI()**
- Display the performance panel

**hideUI()**
- Hide the performance panel

**toggleUI()**
- Toggle panel visibility

**reset()**
- Clear all stats and reset metrics

**exportData()**
- Download performance data as JSON file

**logStats()**
- Print current stats to console

**getAvgOperationTime(type)**
- Get average time for an operation type
- Returns: Number (milliseconds)

**getOperationStats(type)**
- Get detailed stats for an operation
- Returns: Object with { count, avg, min, max }

## Interpreting Results

### FPS (Frames Per Second)

- **60 FPS** - Ideal, silky smooth
- **55-60 FPS** - Good, occasional dropped frames
- **30-55 FPS** - Noticeable lag, needs optimization
- **<30 FPS** - Poor, unacceptable for production

### Operation Timing

- **<16ms** - Fits within one frame (60fps), good
- **16-33ms** - Takes 1-2 frames, acceptable
- **>33ms** - Takes >2 frames, needs optimization

### Layout Thrashing

Count of operations that triggered layout recalculation (>16ms). High numbers indicate:
- Interleaved DOM reads/writes
- Forced synchronous layouts
- Missing read/write batching

## Comparing Variants

### Export Data from Each Variant

1. Open variant (e.g., virtual/index.html)
2. Click "📊 Performance" button
3. Perform test operations (drag, resize, stress test)
4. Click "Export Data"
5. Save file (e.g., `perf-virtual-1234567890.json`)

### Repeat for Other Variants

Export from:
- left-top/index.html → `perf-left-top-*.json`
- transform/index.html → `perf-transform-*.json`
- virtual/index.html → `perf-virtual-*.json`

### Compare Results

Open JSON files and compare:

```json
{
  "variant": "virtual",
  "fps": {
    "avg": 59,
    "min": 55,
    "max": 60
  },
  "operations": {
    "drag": { "avg": 12, "count": 15 },
    "resize": { "avg": 14, "count": 8 },
    "viewport": { "avg": 8, "count": 2 },
    "add": { "avg": 245, "count": 1 }
  },
  "layoutThrashing": 3
}
```

## Integration Status

### ✅ Virtual Variant (Fully Integrated)

- Performance monitor script included
- All operations instrumented:
  - ✅ Drag operations
  - ✅ Resize operations
  - ✅ Viewport switching
  - ✅ Stress test (add items)
  - ✅ Batch rendering

### ✅ Transform Variant (Fully Integrated)

- Performance monitor script included
- All operations instrumented:
  - ✅ Drag operations
  - ✅ Resize operations
  - ✅ Viewport switching
  - ✅ Stress test (add items)

### ✅ Left-Top Variant (Fully Integrated)

- Performance monitor script included
- All operations instrumented:
  - ✅ Drag operations
  - ✅ Resize operations
  - ✅ Viewport switching
  - ✅ Stress test (add items)

## Tips

### Accurate Measurements

1. **Consistent Test Conditions**
   - Same browser, same tab position
   - Close other apps/tabs
   - Test at same time of day (CPU load varies)

2. **Multiple Runs**
   - Run each test 3-5 times
   - Average the results
   - Look for consistency

3. **Realistic Scenarios**
   - Test with actual use cases
   - Vary number of items (50, 100, 200, 500)
   - Test different component types

### Stress Testing

1. Start with clean state
2. Reset stats (click "Reset Stats")
3. Add 200 items using stress test
4. Drag a few items around
5. Resize a few items
6. Switch desktop ↔ mobile
7. Export data

## Example Workflow

```javascript
// 1. Open virtual variant
// 2. Click "📊 Performance"
// 3. Click "Reset Stats"
// 4. Add 200 items
// 5. Drag 5 items
// 6. Resize 3 items
// 7. Switch to mobile view
// 8. Switch back to desktop
// 9. Check stats:
//    - FPS should be >55
//    - Drag avg should be <16ms
//    - Resize avg should be <16ms
//    - Viewport avg should be <30ms
// 10. Export data

// 11. Repeat with transform variant
// 12. Repeat with left-top variant
// 13. Compare exported JSON files
```

## Troubleshooting

### Panel Not Appearing

- Check browser console for errors
- Verify script loaded: `typeof PerformanceMonitor`
- Check initialization: `window.perfMonitor`

### Operations Not Being Tracked

- Verify startOperation/endOperation calls
- Check operation type matches (case-sensitive)
- Ensure endOperation called after startOperation

### FPS Always 60

- Perform actual operations (drag, resize)
- Add many items (100+)
- Check if browser is throttling inactive tabs

## Performance Goals

### Virtual Variant (Production)

- FPS: 58-60 avg (200 items)
- Drag: <12ms avg
- Resize: <14ms avg
- Viewport: <20ms avg
- Add 200 items: <300ms
- Layout thrashing: <5 events

### Transform Variant (Experimental)

- FPS: 55-60 avg (200 items)
- Drag: <15ms avg
- Resize: <16ms avg
- Viewport: <30ms avg

### Left-Top Variant (Baseline)

- FPS: 50-60 avg (200 items)
- Drag: <20ms avg
- Resize: <20ms avg
- Viewport: <40ms avg

## Next Steps

1. ✅ Integrate into virtual variant (DONE)
2. ✅ Integrate into transform variant (DONE)
3. ✅ Integrate into left-top variant (DONE)
4. 📊 Run comparison tests
5. 📈 Document performance differences
6. 🎯 Identify optimization opportunities
