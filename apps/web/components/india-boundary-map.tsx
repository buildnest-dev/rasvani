'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { regions } from '@/lib/regions';

type Bounds = [[number, number], [number, number]];
type Props = {
  level: 'states' | 'districts';
  selectedState?: string | null;
  selectedStateCode?: number | string | null;
  selectedBounds?: Bounds | null;
  fallbackItems?: readonly string[];
  onSelect: (name: string, stateCode?: number | string | null, bounds?: Bounds | null) => void;
  onHover?: (name: string | null) => void;
  onDistrictsAvailable?: (districts: string[]) => void;
};

type BoundaryMetadata = { vector_layers?: Array<{ id: string; fields?: Record<string, unknown> }> };

const STATE_TILES = 'https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/admin/states/LGD_States.pmtiles';
const DISTRICT_TILES = 'https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/admin/districts/LGD_Districts.pmtiles';
const ATTRIBUTION = 'Local Government Directory (LGD), 2024 snapshot · via Bharatlas · CC0 / CC BY 4.0';

// Camera presets are navigation aids only. Polygon geometry, not these centres,
// remains the source of map boundaries and spatial selection.
const REGION_CAMERA: Record<string, { center: [number, number]; zoom: number }> = {
  'Andhra Pradesh': { center: [79.5, 15.8], zoom: 5.2 },
  'Arunachal Pradesh': { center: [94.4, 28.1], zoom: 5.2 },
  Assam: { center: [92.7, 26.1], zoom: 5.4 },
  Bihar: { center: [85.4, 25.8], zoom: 6.1 },
  Chhattisgarh: { center: [81.8, 21.3], zoom: 5.5 },
  Goa: { center: [74.0, 15.4], zoom: 7.0 },
  Gujarat: { center: [71.7, 22.5], zoom: 5.2 },
  Haryana: { center: [76.1, 29.1], zoom: 6.1 },
  'Himachal Pradesh': { center: [77.2, 31.8], zoom: 5.6 },
  Jharkhand: { center: [85.5, 23.6], zoom: 5.8 },
  Karnataka: { center: [75.7, 15.0], zoom: 5.0 },
  Kerala: { center: [76.3, 10.6], zoom: 5.8 },
  'Madhya Pradesh': { center: [78.7, 23.5], zoom: 5.0 },
  Maharashtra: { center: [75.2, 19.5], zoom: 5.0 },
  Manipur: { center: [93.9, 24.7], zoom: 6.1 },
  Meghalaya: { center: [91.3, 25.5], zoom: 6.1 },
  Mizoram: { center: [92.7, 23.3], zoom: 6.1 },
  Nagaland: { center: [94.2, 26.0], zoom: 6.1 },
  Odisha: { center: [85.4, 20.5], zoom: 5.4 },
  Punjab: { center: [75.4, 31.0], zoom: 5.8 },
  Rajasthan: { center: [73.8, 26.5], zoom: 4.9 },
  Sikkim: { center: [88.5, 27.5], zoom: 7.0 },
  'Tamil Nadu': { center: [78.7, 11.1], zoom: 5.2 },
  Telangana: { center: [79.1, 17.9], zoom: 5.4 },
  Tripura: { center: [91.8, 23.8], zoom: 6.4 },
  'Uttar Pradesh': { center: [80.9, 26.8], zoom: 5.0 },
  Uttarakhand: { center: [79.0, 30.1], zoom: 5.5 },
  'West Bengal': { center: [87.8, 23.5], zoom: 5.3 },
  'Andaman and Nicobar Islands': { center: [92.7, 11.5], zoom: 4.6 },
  Chandigarh: { center: [76.8, 30.7], zoom: 8.0 },
  'Dadra and Nagar Haveli and Daman and Diu': { center: [72.9, 20.2], zoom: 6.5 },
  Delhi: { center: [77.1, 28.6], zoom: 7.0 },
  'Jammu and Kashmir': { center: [75.2, 33.7], zoom: 5.0 },
  Ladakh: { center: [77.7, 34.2], zoom: 5.0 },
  Lakshadweep: { center: [72.6, 10.0], zoom: 6.0 },
  Puducherry: { center: [79.8, 11.9], zoom: 7.0 },
};

// State labels use one stable point per State/UT instead of labels generated from
// every clipped/multipart vector-tile polygon. This prevents repeated names on
// island groups and tile boundaries. Points are visual label anchors only; the
// official vector polygons remain the source for boundaries and click selection.
const STATE_LABEL_DATA = {
  type: 'FeatureCollection' as const,
  features: Object.entries(REGION_CAMERA).map(([name, camera]) => ({
    type: 'Feature' as const,
    properties: { name },
    geometry: { type: 'Point' as const, coordinates: camera.center },
  })),
};

function findField(fields: Record<string, unknown>, preferred: string[]) {
  const actual = Object.keys(fields ?? {});
  for (const candidate of preferred) {
    const found = actual.find((key) => key.toLowerCase() === candidate.toLowerCase());
    if (found) return found;
  }
  return null;
}

function geometryBounds(geometry: unknown): Bounds | null {
  const points: [number, number][] = [];
  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      points.push([value[0], value[1]]);
      return;
    }
    value.forEach(visit);
  };
  const coordinates = geometry && typeof geometry === 'object' && 'coordinates' in geometry
    ? (geometry as { coordinates?: unknown }).coordinates
    : undefined;
  visit(coordinates);
  if (!points.length) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}

export function IndiaBoundaryMap({ level, selectedState, selectedStateCode, selectedBounds, fallbackItems = [], onSelect, onHover, onDistrictsAvailable }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Preparing the regional map…');
  const [hovered, setHovered] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let map: MapLibreMap | null = null;
    let removeProtocol: (() => void) | undefined;
    let settled = false;
    let terminalFailure = false;
    let mapReady = false;
    let highlightFrame: number | null = null;
    let lastHoverName = '';
    let lastDistrictNames = '';
    let timeout: number | undefined;

    const clearLoadTimeout = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = undefined;
    };
    const showError = (detail: string) => {
      if (!active || terminalFailure) return;
      terminalFailure = true;
      settled = true;
      clearLoadTimeout();
      setStatus('error');
      setMessage(detail);
    };
    const showReady = () => {
      if (!active || terminalFailure || mapReady) return;
      mapReady = true;
      settled = true;
      clearLoadTimeout();
      setStatus('ready');
      setMessage(level === 'states'
        ? 'Hover to preview and zoom in for smaller regions. The regional index lists all 36 States and UTs.'
        : `District boundaries for ${selectedState ?? 'the selected region'}. Select a district to continue.`);
    };

    setStatus('loading');
    setMessage('Preparing the regional map…');
    setHovered(null);
    timeout = window.setTimeout(() => {
      showError('The map is taking longer than expected to load. Continue from the regional index or try again.');
    }, 16000);

    (async () => {
      try {
        const maplibreModule = await import('maplibre-gl');
        const pmtiles = await import('pmtiles');
        if (!active || settled || !host.current) return;

        // MapLibre GL JS v6 is ESM-only. Use its named exports directly;
        // configure the self-hosted worker before the first Map is created.
        const maplibre = maplibreModule;
        const setWorkerUrl = maplibreModule.setWorkerUrl;
        if (typeof setWorkerUrl !== 'function') {
          throw new Error('This MapLibre build does not expose the v6 setWorkerUrl() export. Confirm maplibre-gl v6 is installed.');
        }
        setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');

        if (typeof maplibre.addProtocol !== 'function' || typeof maplibre.removeProtocol !== 'function') {
          throw new Error('The MapLibre PMTiles protocol API is unavailable. Check the installed maplibre-gl and pmtiles package versions.');
        }

        const protocol = new pmtiles.Protocol();
        maplibre.addProtocol('pmtiles', protocol.tile);
        removeProtocol = () => maplibre.removeProtocol('pmtiles');
        const archiveUrl = level === 'states' ? STATE_TILES : DISTRICT_TILES;
        const archive = new pmtiles.PMTiles(archiveUrl);
        protocol.add(archive);
        const metadata = await archive.getMetadata() as BoundaryMetadata;
        if (!active || settled) return;
        const vectorLayer = metadata.vector_layers?.[0];
        if (!vectorLayer?.id) throw new Error('The regional boundary file did not provide a usable map layer.');

        const fields = vectorLayer.fields ?? {};
        const nameField = (level === 'states'
          ? findField(fields, ['STNAME', 'State_Name', 'STATE_NAME', 'state_name', 'STATE', 'name'])
          : findField(fields, ['DTNAME', 'District', 'DISTRICT', 'District_Name', 'district_name', 'DNAME', 'NAME']))
          ?? Object.keys(fields).find((key) => /name/i.test(key))
          ?? null;
        const stateCodeField = findField(fields, ['State_LGD', 'state_lgd', 'STATE_LGD', 'StateLGD', 'state_lgd_code']);
        const districtStateNameField = findField(fields, ['STNAME', 'State_Name', 'STATE_NAME', 'state_name', 'STATE', 'state']);
        if (!nameField) throw new Error('The regional boundary file is missing its place-name field.');

        map = new maplibre.Map({
          container: host.current,
          style: {
            version: 8,
            glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
            sources: {
              admin: {
                type: 'vector',
                url: `pmtiles://${archiveUrl}`,
                attribution: ATTRIBUTION,
              },
            },
            layers: [{ id: 'atlas-background', type: 'background', paint: { 'background-color': '#f5ead9' } }],
          },
          center: [82.4, 22.8],
          zoom: level === 'states' ? 3.55 : 5.3,
          minZoom: 2.7,
          maxZoom: 10,
          cooperativeGestures: true,
          attributionControl: false,
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
        });

        const currentMap = map;
        currentMap.on('error', (event) => {
          const sourceId = (event as unknown as { sourceId?: string }).sourceId;
          const detail = event.error?.message ?? 'The boundary service could not be reached.';
          if (sourceId === 'admin' || /pmtiles|vector tile|tile request|range request|failed to fetch|network error|403|404/i.test(detail)) {
            showError('The regional map service is unavailable right now. Use the region or district index below while it reconnects.');
          }
        });
        currentMap.addControl(new maplibre.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');
        currentMap.addControl(new maplibre.AttributionControl({ compact: true, customAttribution: ATTRIBUTION }), 'bottom-right');

        currentMap.on('load', () => {
          if (!active || settled) return;
          try {
            const stateFilter = level === 'districts' && stateCodeField && selectedStateCode != null
              ? ['==', ['to-string', ['get', stateCodeField]], String(selectedStateCode)] as import('maplibre-gl').FilterSpecification
              : level === 'districts' && districtStateNameField && selectedState
                ? ['==', ['downcase', ['to-string', ['get', districtStateNameField]]], selectedState.toLowerCase()] as import('maplibre-gl').FilterSpecification
                : undefined;

            currentMap.addLayer({
              id: 'admin-polygons', type: 'fill', source: 'admin', 'source-layer': vectorLayer.id,
              ...(stateFilter ? { filter: stateFilter } : {}),
              paint: {
                'fill-color': (level === 'states'
                  ? ['match', ['downcase', ['to-string', ['get', nameField]]], ...regions.flatMap((region, index) => [region.toLowerCase(), ['#d9b978', '#c98a59', '#b9a16e', '#a9b08a', '#d8a04f'][index % 5]]), '#d9b978']
                  : ['match', ['%', ['to-number', ['coalesce', ['get', stateCodeField ?? nameField], 0]], 5], 0, '#d9b978', 1, '#c98a59', 2, '#b9a16e', 3, '#a9b08a', '#d8a04f']) as import('maplibre-gl').ExpressionSpecification,
                'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.88, 7, 0.72],
                'fill-outline-color': '#fff7e9',
              },
            });
            currentMap.addLayer({
              id: 'admin-lines', type: 'line', source: 'admin', 'source-layer': vectorLayer.id,
              ...(stateFilter ? { filter: stateFilter } : {}),
              paint: { 'line-color': '#7b4d38', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.65, 8, 1.45], 'line-opacity': 0.82 },
            });
            currentMap.addLayer({
              id: 'admin-highlight', type: 'fill', source: 'admin', 'source-layer': vectorLayer.id,
              filter: ['==', ['get', nameField], ''],
              paint: { 'fill-color': '#5a1f24', 'fill-opacity': 0, 'fill-outline-color': '#d6a44d' },
            });
            if (level === 'states') {
              currentMap.addSource('state-label-anchors', { type: 'geojson', data: STATE_LABEL_DATA });
            }
            const labelSource = level === 'states' ? 'state-label-anchors' : 'admin';
            currentMap.addLayer({
              id: 'admin-labels',
              type: 'symbol',
              source: labelSource,
              ...(level === 'districts' ? { 'source-layer': vectorLayer.id, ...(stateFilter ? { filter: stateFilter } : {}) } : {}),
              layout: {
                'text-field': level === 'states' ? ['to-string', ['get', 'name']] : ['to-string', ['get', nameField]],
                'text-font': ['Open Sans Regular'],
                'text-size': level === 'states'
                  ? ['interpolate', ['linear'], ['zoom'], 3.2, 8, 4.5, 9.5, 6, 11.5, 8, 13]
                  : ['interpolate', ['linear'], ['zoom'], 5, 8, 7, 9, 9, 10.5],
                'text-max-width': level === 'states' ? 7 : 8,
                'text-line-height': 1.05,
                'text-letter-spacing': 0.005,
                'text-justify': 'auto',
                'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
                'text-radial-offset': level === 'states' ? 0.35 : 0.25,
                // Keep MapLibre's collision engine enabled. The previous state
                // layer explicitly disabled both checks, which produced the
                // stacked/duplicated labels visible in the user's screenshot.
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'text-optional': true,
                'text-padding': 6,
              },
              paint: { 'text-color': '#4d2a25', 'text-halo-color': '#fff9ee', 'text-halo-width': 1.6 },
            });

            const animateHighlight = (name: string) => {
              if (highlightFrame !== null) window.cancelAnimationFrame(highlightFrame);
              currentMap.setFilter('admin-highlight', ['==', ['get', nameField], name]);
              currentMap.setPaintProperty('admin-highlight', 'fill-opacity', 0.05);
              const start = performance.now();
              const tick = (now: number) => {
                const progress = Math.min(1, (now - start) / 190);
                currentMap.setPaintProperty('admin-highlight', 'fill-opacity', 0.8 * (1 - Math.pow(1 - progress, 3)));
                if (progress < 1) highlightFrame = window.requestAnimationFrame(tick);
                else highlightFrame = null;
              };
              highlightFrame = window.requestAnimationFrame(tick);
            };
            currentMap.on('mousemove', 'admin-polygons', (event) => {
              currentMap.getCanvas().style.cursor = 'pointer';
              const name = String(event.features?.[0]?.properties?.[nameField] ?? '').trim();
              if (!name || name === lastHoverName) return;
              lastHoverName = name;
              setHovered(name);
              onHover?.(name);
              animateHighlight(name);
            });
            currentMap.on('mouseleave', 'admin-polygons', () => {
              currentMap.getCanvas().style.cursor = '';
              lastHoverName = '';
              setHovered(null);
              onHover?.(null);
              if (highlightFrame !== null) window.cancelAnimationFrame(highlightFrame);
              highlightFrame = null;
              currentMap.setFilter('admin-highlight', ['==', ['get', nameField], '']);
              currentMap.setPaintProperty('admin-highlight', 'fill-opacity', 0);
            });
            currentMap.on('click', 'admin-polygons', (event) => {
              const feature = event.features?.[0];
              const name = String(feature?.properties?.[nameField] ?? '').trim();
              if (!name) return;
              const code = level === 'states' && stateCodeField ? feature?.properties?.[stateCodeField] : null;
              onSelect(name, code as number | string | null, geometryBounds(feature?.geometry));
            });

            const publishDistrictIndex = () => {
              if (!active || level !== 'districts' || !onDistrictsAvailable) return;
              const sourceFeatures = currentMap.querySourceFeatures('admin', { sourceLayer: vectorLayer.id });
              const matchingFeatures = sourceFeatures.filter((feature) => {
                const properties = feature.properties ?? {};
                if (stateCodeField && selectedStateCode != null) {
                  return String(properties[stateCodeField] ?? '') === String(selectedStateCode);
                }
                if (districtStateNameField && selectedState) {
                  return String(properties[districtStateNameField] ?? '').trim().toLocaleLowerCase() === selectedState.trim().toLocaleLowerCase();
                }
                return true;
              });
              const names = [...new Set(matchingFeatures
                .map((feature) => String(feature.properties?.[nameField] ?? '').trim())
                .filter(Boolean))].sort((a, b) => a.localeCompare(b));
              const signature = names.join('|');
              if (names.length && signature !== lastDistrictNames) {
                lastDistrictNames = signature;
                onDistrictsAvailable(names);
              }
            };
            if (level === 'districts') currentMap.on('idle', publishDistrictIndex);
            currentMap.once('idle', () => {
              publishDistrictIndex();
              showReady();
            });
            if (level === 'districts' && selectedBounds) {
              currentMap.fitBounds(selectedBounds, { padding: 44, duration: 900, maxZoom: 7.2 });
            } else if (level === 'districts' && selectedState && REGION_CAMERA[selectedState]) {
              const camera = REGION_CAMERA[selectedState];
              currentMap.jumpTo({ center: camera.center, zoom: camera.zoom });
            }
          } catch (error) {
            showError(error instanceof Error ? error.message : 'The map could not be drawn.');
          }
        });
      } catch (error) {
        showError(error instanceof Error ? error.message : 'The regional map could not be loaded.');
      }
    })();

    return () => {
      active = false;
      clearLoadTimeout();
      if (highlightFrame !== null) window.cancelAnimationFrame(highlightFrame);
      map?.remove();
      removeProtocol?.();
    };
  }, [level, selectedState, selectedStateCode, selectedBounds, onSelect, onHover, onDistrictsAvailable, retryKey]);

  return <LocalizedCopy><div className={`india-boundary-wrap ${level === 'states' ? 'boundary-state-view' : 'boundary-district-view'} ${status === 'loading' ? 'map-loading' : ''} ${status === 'error' ? 'map-unavailable' : ''}`}>
    <div className="india-boundary-map" ref={host} role="application" aria-hidden={status === 'error'} aria-label={level === 'states' ? 'Interactive India state and Union Territory boundary map' : `Interactive district boundary map for ${selectedState ?? 'selected region'}`} />
    {status === 'loading' && <div className="boundary-map-loading" role="status"><span className="boundary-loading-orbit"/><div><strong>Preparing your regional food journey…</strong><small>Connecting to the India boundary atlas</small></div></div>}
    {status === 'error' && <div className="boundary-map-fallback-stage" role="status">
      <div className="boundary-fallback-seal" aria-hidden="true">✳</div>
      <div className="boundary-fallback-copy"><span className="eyebrow">RASVANI REGIONAL ATLAS</span><h3>{level === 'states' ? 'Choose your starting point.' : `Explore ${selectedState ?? 'this region'} district by district.`}</h3><p>{message}</p></div>
      {fallbackItems.length > 0 && <div className="boundary-fallback-districts"><div className="fallback-list-heading">{fallbackItems.length} district navigation records</div><div className="fallback-district-grid">{fallbackItems.map((item, index) => <button type="button" key={item} onClick={() => onSelect(item)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><i aria-hidden="true">↗</i></button>)}</div></div>}
      <button type="button" className="boundary-retry-button" onClick={() => setRetryKey((value) => value + 1)}>Retry map connection ↻</button>
    </div>}
    {status === 'ready' && <div className="boundary-map-status" aria-live="polite"><span className="boundary-status-dot ready"/><span>{hovered ? `Selected on map: ${hovered}` : message}</span></div>}
    <div className="boundary-map-credit">Boundaries: LGD 2024 snapshot via Bharatlas · 36 States/UTs · 785 mapped district polygons</div>
  </div></LocalizedCopy>;
}
