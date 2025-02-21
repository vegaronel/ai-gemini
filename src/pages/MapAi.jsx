import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const genAI = new GoogleGenerativeAI('AIzaSyAdgri_uj6KS87-x2CdVy2y98t9F8A-75E');

const LocationFinder = ({ onLocationFound }) => {
  const map = useMapEvents({
    click: async (e) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`
        );
        const data = await response.json();
        onLocationFound(data);
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    },
  });
  return null;
};

const MapAi = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);

  const clearPreviousSelections = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  };

  const getAreaDescription = async (layer, type) => {
    if (type === 'circle') {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      
      return {
        type: 'circle',
        center: [center.lat, center.lng],
        radius: radius,
        description: `a circular area with a radius of ${(radius/1000).toFixed(2)} kilometers, centered at coordinates (${center.lat.toFixed(6)}, ${center.lng.toFixed(6)})`
      };
    } else if (type === 'rectangle' || type === 'polygon') {
      const bounds = layer.getBounds();
      const center = bounds.getCenter();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      return {
        type: type,
        bounds: bounds,
        center: [center.lat, center.lng],
        description: `an area bounded by coordinates: NE(${ne.lat.toFixed(6)}, ${ne.lng.toFixed(6)}) and SW(${sw.lat.toFixed(6)}, ${sw.lng.toFixed(6)})`
      };
    }
    return null;
  };

  const handleAreaSelect = async (e) => {
    clearPreviousSelections();
    
    const layer = e.layer;
    const areaInfo = await getAreaDescription(layer, e.layerType);
    
    if (areaInfo) {
      setSelectedArea(areaInfo);
      setShowChat(true);
      featureGroupRef.current.addLayer(layer);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || !selectedArea) return;

    const newMessage = {
      text: userInput,
      sender: 'user'
    };

    setChatMessages(prev => [...prev, newMessage]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Prepare location context
      const coordinates = selectedArea.center || 
        (selectedArea.bounds ? selectedArea.bounds.getCenter() : null);
      
      let prompt = '';
      
      if (coordinates) {
        prompt = `You are a helpful AI assistant with knowledge about geographical locations and places.
                 I'm looking at an area on the map ${selectedArea.description}.
                 The center coordinates are approximately latitude ${coordinates[0] || coordinates.lat}, longitude ${coordinates[1] || coordinates.lng}.
                 
                 User Question: ${userInput}
                 
                 Please provide information about this location, including:
                 - Notable buildings, landmarks, or points of interest
                 - General characteristics of the area
                 - Any significant features visible from satellite/map view
                 
                 If you're not completely sure about specific details, you can describe what is typically found in this type of area based on its location and surroundings.`;
      } else {
        prompt = `You are a helpful AI assistant with knowledge about geographical locations and places.
                 I'm looking at ${selectedArea.description}.
                 
                 User Question: ${userInput}
                 
                 Please provide information about this location and answer the user's question based on geographical context.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiMessage = {
        text: response.text(),
        sender: 'ai'
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatMessages(prev => [...prev, {
        text: 'Sorry, there was an error processing your request. Please try asking about this area again.',
        sender: 'ai'
      }]);
    }

    setUserInput('');
  };

  return (
    <div className="flex h-screen">
      <div className="w-2/3 h-full relative">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleAreaSelect}
              draw={{
                rectangle: true,
                circle: true,
                polygon: true,
                marker: false,
                polyline: false,
                circlemarker: false
              }}
            />
          </FeatureGroup>
          <LocationFinder onLocationFound={setLocationInfo} />
        </MapContainer>
      </div>

      {showChat && (
        <div className="w-1/3 h-full border-l border-gray-300 p-4 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto mb-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded"
              placeholder="Ask about this area..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MapAi;
