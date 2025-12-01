# Phase Reference Cleanup Task

## Objective

Remove historical "Phase 3" and "Phase 4" references from code comments and documentation, replacing them with descriptive technical terms that explain **what** the architecture does, not **when** it was implemented.

## Why

- External users don't need to know about internal development phases
- Technical descriptions are more useful than historical context
- Keeps documentation focused on current architecture, not development history

## Scope

**Files to update:** 23 files with Phase 3/4 references
**Files to exclude:**
- `PHASE3-COMPLETE.md` (historical documentation)
- `PHASE4-COMPLETE.md` (historical documentation)

## Replacement Strategy

### Pattern 1: Simple phase mentions
```typescript
// Before
* Grid Builder API instance (Phase 4: Instance-based architecture)

// After
* Grid Builder API instance (instance-based architecture)
```

### Pattern 2: Phase with explanation
```typescript
// Before
* Virtual renderer service instance (Phase 4)

// After
* Virtual renderer service instance (passed from grid-builder)
```

### Pattern 3: Phase migration notes
```typescript
// Before
* **Why needed**: With Phase 4 instance-based architecture, grid-builder
* uses its own state instance.

// After
* **Why needed**: Grid-builder uses its own state instance for multi-instance support.
```

### Pattern 4: Singleton migration comments (REMOVE ENTIRELY)
```typescript
// Before
* Migrated from singleton pattern to instance-based approach in Phase 4
* to support multiple grid-builder instances on the same page.

// After
(Remove - users don't need migration history, only current architecture)

// Keep if needed for technical clarity:
* Instance-based architecture supports multiple grid-builder instances on the same page.
```

**Guideline**: Remove historical "migration from singleton" context. Users should only see the current instance-based approach, not the historical transition.

## Files to Update

### Source Files (21 files)

#### Components
- [ ] `src/components/canvas-section/canvas-section.tsx`
- [ ] `src/components/canvas-section-viewer/canvas-section-viewer.tsx`
- [ ] `src/components/grid-item-wrapper/grid-item-wrapper.tsx`
- [ ] `src/components/grid-viewer/grid-viewer.tsx`

#### Demo Components
- [ ] `src/demo/components/layer-panel/layer-panel.tsx`

#### Services
- [ ] `src/services/state-manager.ts`
- [ ] `src/services/virtual-renderer.ts`
- [ ] `src/services/undo-redo.ts`
- [ ] `src/services/event-manager.ts`

#### Tests
- [ ] `src/components/canvas-section/test/canvas-section.spec.tsx`
- [ ] `src/components/grid-item-wrapper/test/grid-item-wrapper.spec.tsx`
- [ ] `src/demo/components/config-panel/test/config-panel.spec.tsx`
- [ ] `src/services/grid-builder-api.spec.ts`
- [ ] `src/utils/canvas-height-calculator-instance.spec.ts`
- [ ] `src/utils/space-finder-instance.spec.ts`

#### Auto-generated (will update after rebuilding)
- [ ] `src/components.d.ts`
- [ ] `src/components/canvas-section/readme.md`
- [ ] `src/components/canvas-section-viewer/readme.md`
- [ ] `src/components/grid-item-wrapper/readme.md`
- [ ] `src/demo/components/layer-panel/readme.md`

#### Documentation
- [ ] `README.md`

## Process

1. **Update source files** (tsx, ts files) - manually review each
2. **Run build** - regenerates readme.md and components.d.ts files
3. **Update README.md** - top-level documentation
4. **Run tests** - ensure no breakage: `npm test`
5. **Commit** - single logical commit with all changes

## Search Command

```bash
# Find all references
grep -rn "Phase [34]" src/ README.md --exclude-dir=node_modules

# Count references per file
grep -r "Phase [34]" src/ README.md --exclude-dir=node_modules | cut -d: -f1 | sort | uniq -c
```

## Verification

After cleanup:
- [ ] No "Phase 3" or "Phase 4" in source files (src/)
- [ ] No "Phase 3" or "Phase 4" in README.md
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Historical docs (PHASE3-COMPLETE.md, PHASE4-COMPLETE.md) unchanged

## Estimated Time

- **Review and update:** 1-2 hours
- **Test and verify:** 30 minutes
- **Total:** 1.5-2.5 hours

## Notes

- Keep technical explanations (e.g., "instance-based architecture", "singleton pattern")
- Preserve **what** and **why** explanations
- Remove **when** (phase numbers) context
- Some comments explain migration from singleton → instance-based; preserve this context but remove phase numbers
