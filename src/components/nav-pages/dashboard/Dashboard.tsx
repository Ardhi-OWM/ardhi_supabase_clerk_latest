"use client";

import React, { useState, useEffect } from "react";
import { PanelLeftOpen, PanelRightOpen, ChevronDown, ChevronUp } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { GeoJsonObject } from "geojson";
import * as L from "leaflet";

import { mapLayers } from "@/components/constants";
import SidebarItems from "@/components/nav-pages/dashboard/SidebarItems";
import SearchControl from "@/components/nav-pages/dashboard/db_functions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

// Define a custom GeoJSON type with properties
interface CustomGeoJSON extends GeoJsonObject {
    properties?: {
        name?: string;
        type?: string;
        bounds?: [L.LatLngExpression, L.LatLngExpression]; // Array of two LatLngExpression values
        imageUrl?: string;
    };
}

// Component to handle GeoTIFF overlay
interface GeoTIFFOverlayProps {
    geoTIFFOverlay: L.ImageOverlay | null;
}

const GeoTIFFOverlay: React.FC<GeoTIFFOverlayProps> = ({ geoTIFFOverlay }) => {
    const map = useMap();

    useEffect(() => {
        if (geoTIFFOverlay) {
            geoTIFFOverlay.addTo(map);

            // Fit the map to the bounds of the overlay
            map.fitBounds(geoTIFFOverlay.getBounds());

            // Cleanup function to remove the overlay when the component unmounts
            return () => {
                geoTIFFOverlay.remove();
            };
        }
    }, [geoTIFFOverlay, map]);

    return null; // This component doesn't render anything
};

// Component to handle map bounds
const MapBounds: React.FC<{ geoJSONDataList: CustomGeoJSON[] }> = ({ geoJSONDataList }) => {
    const map = useMap();

    useEffect(() => {
        if (!geoJSONDataList.length || !map) return;

        const allBounds = geoJSONDataList
            .map((geoJSON) => {
                if (geoJSON.properties?.bounds) {
                    // Convert bounds to LatLngBounds
                    return L.latLngBounds(geoJSON.properties.bounds);
                }
                const layer = L.geoJSON(geoJSON);
                return layer.getBounds();
            })
            .filter((bounds) => bounds.isValid());

        if (allBounds.length === 0) return;

        const mergedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds), allBounds[0]);

        if (mergedBounds.isValid()) {
            map.fitBounds(mergedBounds);
        }
    }, [map, geoJSONDataList]);

    return null;
};

// Main DashboardMap component
const DashboardMap: React.FC = () => {
    const [geoJSONDataList, setGeoJSONDataList] = useState<CustomGeoJSON[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [activeLayer, setActiveLayer] = useState(
        mapLayers.find((layer) => layer.default)?.url || mapLayers[0].url
    );
    const [geoTIFFOverlay, setGeoTIFFOverlay] = useState<L.ImageOverlay | null>(null);

    return (
        <div className="flex h-[calc(100vh-5rem)] overflow-hidden w-full">
            <div
                className={`transition-all duration-300 flex flex-col border-r border-gray-200/[0.25] z-50 ${sidebarOpen ? "w-64" : "min-w-12"}`}
            >
                <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} className="self-end m-2">
                    {sidebarOpen ? <PanelRightOpen /> : <PanelLeftOpen />}
                </IconButton>

                {sidebarOpen && (
                    <Box className="mt-2">
                        <SidebarItems
                            geoJSONDataList={geoJSONDataList}
                            setGeoJSONDataList={setGeoJSONDataList}
                            setGeoTIFFOverlay={setGeoTIFFOverlay}
                        />
                    </Box>
                )}
            </div>

            {/* Map Area */}
            <div className="relative flex-grow h-full">
                <MapContainer
                    center={[52.520008, 13.404954]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ width: "100%", height: "100%" }}
                    className="w-full h-full"
                >
                    <SearchControl />
                    <TileLayer key={activeLayer} url={activeLayer} />

                    {geoJSONDataList.map((geoJSONData, index) => (
                        <GeoJSON key={index} data={geoJSONData} />
                    ))}

                    {/* Add the GeoTIFFOverlay component */}
                    <GeoTIFFOverlay geoTIFFOverlay={geoTIFFOverlay} />

                    {/* Add the MapBounds component */}
                    <MapBounds geoJSONDataList={geoJSONDataList} />

                    {/* Layer Selector Dropdown */}
                    <div className="absolute bottom-2 left-2 z-[1001]">
                        <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
                            <DropdownMenuTrigger asChild>
                                <span className="flex items-center px-6 py-3 border border-purple-300 rounded-md cursor-pointer shadow-lg bg-background text-base min-w-40">
                                    {mapLayers.find((layer) => layer.url === activeLayer)?.name || "Select Map Layer"}
                                    <span className="ml-2">
                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                className="border border-gray-300 rounded-lg shadow-md "
                                style={{ zIndex: 1001 }}
                            >
                                {mapLayers.map((layer) => (
                                    <DropdownMenuItem
                                        key={layer.url}
                                        onClick={() => setActiveLayer(layer.url)}
                                        className={`cursor-pointer ${activeLayer === layer.url ? "bg-blue-500 " : "hover:bg-gray-200"}`}
                                    >
                                        {layer.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </MapContainer>
            </div>
        </div>
    );
};

export default DashboardMap;