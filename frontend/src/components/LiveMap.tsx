import React, { useEffect, useRef, useState } from 'react';
import { NeedReport, Volunteer } from '../types';
import L from 'leaflet';
import { Crosshair, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface LiveMapProps {
  needs: NeedReport[];
  volunteers: Volunteer[];
  selectedNeed: NeedReport | null;
  onSelectNeed: (need: NeedReport) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  needs,
  volunteers,
  selectedNeed,
  onSelectNeed
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapMode, setMapMode] = useState<'tactical' | 'satellite'>('tactical');
  const [radarActive, setRadarActive] = useState<boolean>(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6320, 77.3620],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Add Incident Pins
    needs.forEach((need) => {
      const isCritical = need.urgency === 'CRITICAL';
      const isHigh = need.urgency === 'HIGH';
      const isSelected = selectedNeed?.id === need.id;
      const isResolved = need.status === 'RESOLVED';

      const color = isResolved ? '#10b981' : isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#06b6d4';
      const size = isSelected ? 32 : isCritical ? 26 : 22;

      const markerHtml = `
        <div class="rn-radar-pin ${isCritical ? 'pin-critical' : ''} ${isSelected ? 'pin-selected' : ''}" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 ${isSelected ? '24px' : '12px'} ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: ${size > 24 ? '11px' : '10px'};
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${need.priorityScore}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-radar-icon',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([need.location.lat, need.location.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectNeed(need);
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #0a1f16; max-width: 220px; padding: 2px;">
          <div style="font-weight: 700; font-size: 11px; margin-bottom: 3px; color: ${color}; text-transform: uppercase;">
            ${need.urgency} • ${need.category} (Score: ${need.priorityScore})
          </div>
          <div style="font-size: 11px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; color: #111;">
            ${need.title}
          </div>
          <div style="font-size: 10px; color: #555; margin-bottom: 4px;">
            📍 ${need.location.address}
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #059669; text-transform: uppercase;">
            Status: ${need.status}
          </div>
        </div>
      `);

      layer.addLayer(marker);
    });

    // Add Volunteer GPS Markers
    volunteers.forEach((v) => {
      const isAvailable = v.status === 'AVAILABLE';
      const volMarkerHtml = `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${isAvailable ? '#10b981' : '#64748b'};
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${isAvailable ? '#10b981' : 'transparent'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 8px;
          font-weight: 700;
        ">
          V
        </div>
      `;

      const volIcon = L.divIcon({
        className: 'custom-vol-icon',
        html: volMarkerHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const volMarker = L.marker([v.location.lat, v.location.lng], { icon: volIcon });
      volMarker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #111;">
          <strong>${v.name}</strong> (${v.role})<br />
          <span style="color: ${isAvailable ? '#10b981' : '#64748b'}; font-weight: 600;">${v.status}</span> • ${v.distanceKm || 1.2} km away
        </div>
      `);
      layer.addLayer(volMarker);
    });

    // Pan to selected incident
    if (selectedNeed) {
      map.panTo([selectedNeed.location.lat, selectedNeed.location.lng], { animate: true });
    }
  }, [needs, volunteers, selectedNeed, onSelectNeed]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="rn-live-map-container">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="rn-leaflet-canvas" />

      {/* Tactical Radar HUD Overlay */}
      {radarActive && (
        <div className="rn-radar-hud" style={{ pointerEvents: 'none' }}>
          {/* Tactical Circular Radar Boundary */}
          <div className="rn-radar-circle-disc">
            {/* The sweeping conic beam */}
            <div className="rn-radar-sweep-beam"></div>

            {/* Concentric distance rings with distance markings */}
            <div className="rn-radar-ring ring-1">
              <span className="rn-ring-dist">1.0 KM</span>
            </div>
            <div className="rn-radar-ring ring-2">
              <span className="rn-ring-dist">2.5 KM</span>
            </div>
            <div className="rn-radar-ring ring-3">
              <span className="rn-ring-dist">5.0 KM</span>
            </div>

            {/* Crosshairs */}
            <div className="rn-radar-crosshair-h"></div>
            <div className="rn-radar-crosshair-v"></div>

            {/* Center Blip Origin */}
            <div className="rn-radar-origin-dot"></div>

            {/* Compass Cardinal Points */}
            <span className="rn-cardinal card-n">N 000°</span>
            <span className="rn-cardinal card-s">S 180°</span>
            <span className="rn-cardinal card-e">E 090°</span>
            <span className="rn-cardinal card-w">W 270°</span>
          </div>

          {/* Corner Telemetry Tags */}
          <div className="rn-radar-telemetry-corner top-left">
            <span>[ RADAR: 9.4 GHz ACTIVE ]</span>
          </div>
          <div className="rn-radar-telemetry-corner top-right">
            <span>[ TARGETS: {needs.length} TRACKED ]</span>
          </div>
          <div className="rn-radar-telemetry-corner bottom-left">
            <span>[ LAT 28.632° N • LNG 77.362° E ]</span>
          </div>
          <div className="rn-radar-telemetry-corner bottom-right">
            <span>[ RANGE: 5.0 KM AZIMUTH ]</span>
          </div>
        </div>
      )}

      {/* Floating Tactical Controls */}
      <div className="rn-map-floating-controls">
        <button 
          type="button" 
          className={`rn-map-btn ${radarActive ? 'active-radar' : ''}`} 
          onClick={() => setRadarActive(!radarActive)} 
          title={radarActive ? "Disable Radar HUD" : "Activate Radar HUD"}
        >
          <Crosshair size={14} />
        </button>
        <button 
          type="button" 
          className="rn-map-btn" 
          onClick={handleZoomIn} 
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button 
          type="button" 
          className="rn-map-btn" 
          onClick={handleZoomOut} 
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
      </div>
    </div>
  );
};
