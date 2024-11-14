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
            style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY', // We'll need to configure this
            center: [-98.5795, 39.8283], // US center coordinates - adjust as needed
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

    loadInitialLayers() {
        // This will be implemented to load initial GIS layers
    }

    changeBasemap(style) {
        // This will be implemented to switch basemap styles
    }

    addLayer(layerId, source, type, paint) {
        // This will be implemented to add new layers
    }
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const mapManager = new MapManager('map');
});
