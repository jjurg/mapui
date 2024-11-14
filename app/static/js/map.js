class MapManager {
    constructor(mapId) {
        this.map = null;
        this.mapId = mapId;
        this.layers = new Map();
        this.init();
    }

    init() {
        this.map = new maplibregl.Map({
            container: this.mapId,
            style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY',
            center: [-98.5795, 39.8283],
            zoom: 4
        });

        this.map.on('load', () => {
            this.setupControls();
            this.loadInitialLayers();
        });
    }

    setupControls() {
        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl());
        
        // Setup basemap selector
        const basemapSelector = document.getElementById('basemap-selector');
        if (basemapSelector) {
            basemapSelector.addEventListener('change', (e) => {
                this.changeBasemap(e.target.value);
            });
        }
    }

    async loadInitialLayers() {
        // Load available feature types
        const featureTypes = ['towers', 'coverage_areas']; // We can make this dynamic later
        
        for (const featureType of featureTypes) {
            try {
                const response = await fetch(`/api/features/${featureType}`);
                const features = await response.json();
                
                // Add source
                this.map.addSource(featureType, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });

                // Add layer based on feature type
                if (featureType === 'towers') {
                    this.addTowerLayer(featureType);
                } else if (featureType === 'coverage_areas') {
                    this.addCoverageLayer(featureType);
                }

                // Add to layer control
                this.addLayerControl(featureType);
            } catch (error) {
                console.error(`Error loading ${featureType}:`, error);
            }
        }
    }

    addTowerLayer(sourceId) {
        this.map.addLayer({
            'id': `${sourceId}-layer`,
            'type': 'circle',
            'source': sourceId,
            'paint': {
                'circle-radius': 6,
                'circle-color': [
                    'match',
                    ['get', 'status'],
                    'active', '#28a745',
                    'maintenance', '#ffc107',
                    '#dc3545' // default color for unknown status
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add popup for towers
        this.addPopup(`${sourceId}-layer`);
    }

    addCoverageLayer(sourceId) {
        this.map.addLayer({
            'id': `${sourceId}-layer`,
            'type': 'fill',
            'source': sourceId,
            'paint': {
                'fill-color': '#007bff',
                'fill-opacity': 0.3,
                'fill-outline-color': '#0056b3'
            }
        });

        // Add popup for coverage areas
        this.addPopup(`${sourceId}-layer`);
    }

    addPopup(layerId) {
        // Create popup but don't add to map (it will follow the cursor)
        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        this.map.on('mouseenter', layerId, (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            
            const coordinates = e.features[0].geometry.type === 'Point' 
                ? e.features[0].geometry.coordinates.slice()
                : e.lngLat;
                
            const properties = e.features[0].properties;
            const html = this.createPopupHTML(properties);

            popup.setLngLat(coordinates)
                .setHTML(html)
                .addTo(this.map);
        });

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = '';
            popup.remove();
        });
    }

    createPopupHTML(properties) {
        let html = '<div class="popup-content">';
        for (const [key, value] of Object.entries(properties)) {
            html += `<strong>${key}:</strong> ${value}<br>`;
        }
        html += '</div>';
        return html;
    }

    addLayerControl(layerId) {
        const layerList = document.querySelector('.layer-list');
        if (!layerList) return;

        const div = document.createElement('div');
        div.className = 'layer-control-item';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `toggle-${layerId}`;
        input.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `toggle-${layerId}`;
        label.textContent = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        div.appendChild(input);
        div.appendChild(label);
        layerList.appendChild(div);

        input.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            this.map.setLayoutProperty(`${layerId}-layer`, 'visibility', visibility);
        });
    }

    changeBasemap(style) {
        const styles = {
            'osm': {
                url: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY'
            },
            'arcgis-streets': {
                url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Street_Map/VectorTileServer/resources/styles/root.json'
            },
            'arcgis-earth': {
                url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Imagery/VectorTileServer/resources/styles/root.json'
            },
            'stamen': {
                url: 'https://tiles.stadiamaps.com/styles/stamen_terrain.json'
            }
        };

        if (!styles[style]) {
            console.error(`Unknown style: ${style}`);
            return;
        }

        // Store current center and zoom
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        // Store current layer visibility states
        const layerStates = {};
        this.map.getStyle().layers.forEach(layer => {
            if (layer.id.endsWith('-layer')) {
                layerStates[layer.id] = this.map.getLayoutProperty(layer.id, 'visibility');
            }
        });

        // Change the style
        this.map.setStyle(styles[style].url);

        // After the style loads, restore the GIS layers and their states
        this.map.once('style.load', () => {
            // Restore center and zoom
            this.map.setCenter(center);
            this.map.setZoom(zoom);

            // Reload the GIS layers
            this.loadInitialLayers().then(() => {
                // Restore visibility states
                Object.entries(layerStates).forEach(([layerId, visibility]) => {
                    this.map.setLayoutProperty(layerId, 'visibility', visibility);
                    
                    // Update checkbox state in layer control
                    const checkbox = document.getElementById(`toggle-${layerId.replace('-layer', '')}`);
                    if (checkbox) {
                        checkbox.checked = visibility === 'visible';
                    }
                });
            });
        });
    }
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    MapManager.setupSplitView();
});

// Add these static methods to the MapManager class
static setupSplitView() {
    const mapA = new MapManager('mapA');
    let mapB = null;
    let isSplitView = false;

    // Toggle split view button handler
    document.getElementById('toggle-split-view').addEventListener('click', () => {
        const singleView = document.querySelector('.map-wrapper.single');
        const splitView = document.querySelector('.map-wrapper.split');
        
        if (!isSplitView) {
            // Switch to split view
            singleView.classList.remove('active');
            singleView.classList.add('hidden');
            splitView.classList.remove('hidden');
            splitView.classList.add('active');
            
            // Initialize second map if not already done
            if (!mapB) {
                mapB = new MapManager('mapB');
                MapManager.syncMaps(mapA, mapB);
            }
        } else {
            // Switch to single view
            splitView.classList.remove('active');
            splitView.classList.add('hidden');
            singleView.classList.remove('hidden');
            singleView.classList.add('active');
        }
        
        isSplitView = !isSplitView;
        
        // Trigger resize event to ensure maps render correctly
        window.dispatchEvent(new Event('resize'));
    });

    // Setup individual basemap selectors
    const setupBasemapSelector = (mapInstance, selectId) => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', (e) => {
                mapInstance.changeBasemap(e.target.value);
            });
        }
    };

    setupBasemapSelector(mapA, 'mapA-basemap');
    setupBasemapSelector(mapB, 'mapB-basemap');
}

static syncMaps(mapA, mapB) {
    const syncMove = (sourceMap, targetMap) => {
        targetMap.map.setCenter(sourceMap.map.getCenter());
        targetMap.map.setZoom(sourceMap.map.getZoom());
        targetMap.map.setBearing(sourceMap.map.getBearing());
        targetMap.map.setPitch(sourceMap.map.getPitch());
    };

    // Sync map A to B
    mapA.map.on('move', () => {
        syncMove(mapA, mapB);
    });

    // Sync map B to A
    mapB.map.on('move', () => {
        syncMove(mapB, mapA);
    });
}
