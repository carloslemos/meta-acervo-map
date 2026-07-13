# Bubble Structure & profileStats Analysis

**Document Date:** 2026-07-12  
**Codebase State:** Svelte 5 (legacy mode), no TypeScript, no tests yet

---

## 1. Bubble Structure & Fields

### Complete Bubble Schema

Every bubble (except type='acervo') has these fields:

```javascript
{
  // Identifiers
  id: string,                      // 'birth-42', 'death-42', 'education-42-0'
  creator: string,                 // Creator name (deduplicated across bubble types)
  
  // Location
  lat: number,                     // Latitude (required to create bubble)
  lon: number,                     // Longitude (required to create bubble)
  country: string | null,          // Country name (English, from TopoJSON) — populated by annotateGeo()
  continent: string | null,        // Continent in PT-BR (via ISO_CONTINENT) — populated by annotateGeo()
  place: string,                   // Human-readable location (from CSV or schoolName)
  
  // Classification
  type: 'birth' | 'death' | 'education' | 'acervo',  // Bubble type
  gender: string,                  // 'female', 'male', 'non-binary', 'unknown'
  nationality: string,             // Country of citizenship (from CSV)
  
  // Acervo & Education
  acervos: string[],               // Array of collection names (deduplicated)
  educatedAt: string[],            // All schools where creator studied (array)
  
  // Education-specific
  schoolName?: string,             // (type='education' only) Name of school
  dates?: string,                  // (type='education' only) Study period
  
  // Quality metrics
  score: number,                   // Quality score (0 for education, varies for birth/death)
  confidence: 'alta' | 'médio' | 'baixo' | null,  // Data confidence level
  
  // Collision avoidance (pre-computed in loadData)
  dxBase: number,                  // X offset from forceCollide (reference frame)
  dyBase: number,                  // Y offset from forceCollide (reference frame)
}
```

### Region/Continent Fields

| Field | Source | When Populated | Values |
|---|---|---|---|
| `continent` | TopoJSON + ISO_CONTINENT map | During `annotateGeo()` after bubbles created | 'África', 'América do Norte', 'América do Sul', 'Ásia', 'Europa', 'Oceania', 'Antártica', or `null` |
| `country` | TopoJSON properties.name | During `annotateGeo()` | Country name (English) or `null` |
| `place` | CSV or schoolName | During bubble creation | Human text (e.g., "São Paulo", "École des Beaux-Arts") |
| `nationality` | CSV `country of citizenship` | During bubble creation | Text or empty string |

### Key Insights

✅ **`continent` is always set by `annotateGeo()`** after bubble creation via `d3.geoContains()` against TopoJSON features.

✅ **For birth bubbles:** `continent` comes from the birth location's coordinates.

✅ **For education bubbles:** `continent` comes from the school's coordinates.

✅ **For death bubbles:** `continent` comes from the death location's coordinates.

❌ **`continent` can be `null`** if the location doesn't match any TopoJSON feature (e.g., invalid coordinates).

---

## 2. Current State: `src/lib/profileStats.js`

### Location & Status
- **File:** [src/lib/profileStats.js](src/lib/profileStats.js)
- **Status:** ✅ **EXISTS and is COMPLETE** — Pure, testable function for analytics aggregation
- **Size:** ~135 lines

### Function Signature
```javascript
export function profileStats(bubbles)
  → { genderTop, formationTop, birthByRegion, formationByRegion }
```

### Implementation Details

**Deduplication Strategy:**
- Reads all bubbles (filters out `type='acervo'`)
- Creates a `Map<creator, entry>` where each entry tracks:
  - `gender` (from first bubble of that creator)
  - `birthContinent` (from first `type='birth'` bubble)
  - `formationPlace` (from first `type='education'` bubble, uses `schoolName || place`)
  - `formationContinent` (from first `type='education'` bubble)

**Output Structure:**
```javascript
{
  genderTop: { label: string, pct: number } | null,
  formationTop: { label: string, pct: number } | null,
  birthByRegion: [{ label: string, pct: number }, ...],  // Top 4 by frequency
  formationByRegion: [{ label: string, pct: number }, ...] // Top 4 by frequency
}
```

### Helper Function: `topFromFreq()`
- Converts `Map<string, count>` → sorted array of `{ label, pct }`
- Sorts by frequency (desc), ties broken by `localeCompare()`
- Returns top N entries with percentages rounded to nearest integer

### Edge Cases Handled
✅ Empty input → all null/[]  
✅ Filters out `type='acervo'` bubbles  
✅ Handles missing fields gracefully (uses `??`, checks falsy)  
✅ Zero denominators → returns empty arrays  
✅ Deduplicates by creator name (one creator = one row in stats)  
✅ Deterministic ordering (breaks ties with `localeCompare`)

---

## 3. Test File: `src/lib/__tests__/profileStats.test.js`

### Location & Status
- **File:** [src/lib/__tests__/profileStats.test.js](src/lib/__tests__/profileStats.test.js)
- **Status:** ✅ **EXISTS and is COMPREHENSIVE** — 11 test cases
- **Size:** ~135 lines
- **Framework:** Jest

### Test Coverage

| Test Case | Focus |
|---|---|
| `empty input` | Empty array → null/[] output |
| `filters acervo type` | Ignores `type='acervo'` bubbles |
| `100% gender` | All creators same gender → pct=100 |
| `mixed gender` | Two genders → returns most frequent |
| `dedup by creator` | One creator, 3 bubbles (birth/edu/death) → counts as 1 |
| `birthByRegion top 4` | >4 continents → returns only top 4, ordered desc |
| `formationByRegion top 4` | >4 continents → returns only top 4, ordered desc |
| `stable ordering tie-breaker` | Same input twice → same output (deterministic) |
| `formationTop` | Returns most frequent school name |
| `no education bubbles` | Handles case with 0 education bubbles |

### Helper Factories
```javascript
mkBirth(creator, overrides)   // → { type: 'birth', creator, continent: 'América do Sul', ... }
mkEdu(creator, overrides)     // → { type: 'education', schoolName: 'USP', continent: 'América do Sul', ... }
mkDeath(creator, overrides)   // → { type: 'death', continent: 'América do Sul', ... }
```

All factories include sensible defaults (`gender: 'female'`, `continent: 'América do Sul'`) to reduce test boilerplate.

---

## 4. Data Creation: `src/lib/dataUtils.js`

### Main Function: `loadData()`
- **Location:** [src/lib/dataUtils.js](src/lib/dataUtils.js) (lines 170–450)
- **Status:** ✅ **COMPLETE** — Handles full pipeline

### Pipeline Steps

1. **Load CSV** via `d3.dsv(CSV_CREATORS_DELIMITER, CSV_CREATORS_PATH)`
2. **Per row:** Create up to 3 bubbles if lat/lon exist
   - **Birth bubble:** from `lat_birth`, `lon_birth`, `place of birth`
   - **Death bubble:** from `lat_death`, `lon_death`, `place of death`
   - **Education bubbles:** Multiple (one per school), from `educated at`, `lat_educated_at`, `lon_educated_at` (split by ` > `)
3. **Reorder educations:** Nearest-neighbor sort from birth point (minimize crossing lines)
4. **Build trajectories:** Connect points (birth → edu₁ → edu₂ → … → death)
5. **Pre-compute collision offsets:** Run `d3.forceCollide()` once on reference projection
6. **Annotate geo:** Call `annotateGeo()` to populate `country` and `continent` fields
7. **Return:** `{ bubbles, trajectories, artworksByCreator, acervoBubbles }`

### Continent Population: `annotateGeo()`
- **Location:** [src/lib/dataUtils.js](src/lib/dataUtils.js) (lines 440–460)
- **Logic:**
  1. Initialize `b.country = null`, `b.continent = null` for all bubbles
  2. For each TopoJSON feature:
     - Get feature name and ISO continent code
     - For each bubble: if `d3.geoContains(feature, [lon, lat])`, set country & continent
  3. Stops at first match per bubble (no duplicates)

### Related Constants

**CSV Configuration:**
```javascript
export const CSV_CREATORS_PATH = 'source/atlas_ma_0610_v2.csv';
export const CSV_CREATORS_DELIMITER = ',';
export const CSV_ACERVOS_PATH = 'source/acervos_geolocated.csv';
```

**Geographic Reference:**
```javascript
export const CENTRAL_ROTATION = [54, 0, 0];  // Brazil-centered
export const REF_W = 960;
export const REF_H = 500;
export const BUBBLE_RADIUS = 2.5;
```

**Continent Mapping:**
```javascript
export const ISO_CONTINENT = {
  '76': 'América do Sul',   // Brazil
  '250': 'Europa',          // France
  // ... 100+ entries
}
```

---

## 5. Constants: `src/lib/constants.js`

### Relevant Constants for Regions/Continents

#### Type Colors & Labels
```javascript
export const TYPE_COLOR = {
  birth:     '#f0e442',  // yellow
  death:     '#009e74',  // green
  education: '#cc79a7',  // pink
  acervo:    '#ffffff',  // white
};

export const TYPE_LABEL = {
  birth:     'Nascimento',
  death:     'Morte',
  education: 'Estudos',
  acervo:    'Acervo',
};
```

#### Continent Mapping: `ISO_CONTINENT`
- **Type:** `Map<ISO_3166_1_numeric, continent_pt_br>`
- **Size:** ~260 countries mapped
- **Regions:** Afrika, América do Norte, América do Sul, Ásia, Europa, Oceania, Antártica
- **Source:** Used by `continentForIsoId()` in dataUtils

#### Projection Parameters
```javascript
export const CENTRAL_ROTATION = [54, 0, 0];
export const REF_W = 960;
export const REF_H = 500;
```

#### Confidence Levels
```javascript
export const CONFIDENCE_LABEL = {
  alta:  'Alta',
  média: 'Médio',
  baixa: 'Baixa',
};
```

---

## 6. Deduplication & Aggregation Utilities

### Current Utilities

| Function | File | Purpose | Input | Output |
|---|---|---|---|---|
| `profileStats()` | profileStats.js | Aggregate stats by unique creator | bubbles[] | { genderTop, formationTop, birthByRegion, formationByRegion } |
| `topFromFreq()` | profileStats.js (helper) | Convert freq map to sorted array | Map<string, number>, topN, total | [{ label, pct }] |
| `splitSemicolon()` | dataUtils.js | Split acervos by ` > ` and deduplicate | string | string[] |
| `splitGt()` | dataUtils.js | Split by ` > ` (generic) | string | string[] |
| `continentForIsoId()` | dataUtils.js | Map ISO code → continent name | string\|number | string\|null |

### Deduplication Strategies

**By Creator:**
- `profileStats()`: Maintains `Map<creator, entry>`, ensures one creator = one stat row
- Strategy: First-seen wins (first birth continent, first education place)

**By Acervo:**
- `splitSemicolon()`: Uses `new Set()` to remove duplicate acervo names
- Strategy: Order-preserving dedup (Set removes by first occurrence)

**By Education School:**
- `profileStats()`: Tracks only `formationPlace` (first school found per creator)
- No array aggregation; just the "primary" education location

---

## 7. Testing Patterns & Jest Configuration

### Jest Setup
- **Config:** [jest.config.js](jest.config.js)
- **Test Runner:** Jest (Node environment)

### Test File Pattern
- **Location:** `src/lib/__tests__/[module].test.js`
- **Naming:** `[name].test.js`
- **Coverage:** profileStats.test.js covers 11 scenarios

### Assertion Patterns (from profileStats.test.js)
```javascript
expect(result.genderTop).toBeNull();
expect(result.genderTop).toEqual({ label: 'female', pct: 100 });
expect(result.birthByRegion).toHaveLength(4);
expect(result.birthByRegion[0].label).toBe('Europa');
expect(result.birthByRegion[i].pct).toBeGreaterThanOrEqual(result.birthByRegion[i + 1].pct);
```

### No TypeScript
- Tests use JSDoc comments for type hints
- No `.test.ts` or `.test.tsx` files

---

## Summary Table: Region/Continent Data

| Aspect | Status | Details |
|---|---|---|
| **Continent Field** | ✅ Present | All bubbles have `continent` (set by `annotateGeo()`) |
| **Country Field** | ✅ Present | All bubbles have `country` (set by `annotateGeo()`) |
| **ISO_CONTINENT Map** | ✅ Complete | 260+ countries mapped to 7 continents |
| **profileStats.js** | ✅ Exists & Complete | Pure function, fully tested |
| **profileStats Tests** | ✅ Comprehensive | 11 test cases covering edge cases |
| **Deduplication** | ✅ Working | By creator, by acervo, by school (first-seen wins) |
| **Aggregation** | ✅ Working | Top N by frequency, with percentages |
| **Testing Framework** | ✅ Jest | Node environment, no TypeScript |
