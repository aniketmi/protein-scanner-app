import React, { useState, useRef, useCallback } from 'react';
import { Camera, Search, Shield, AlertTriangle, CheckCircle, History, Zap } from 'lucide-react';

const ProteinScannerApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Mock barcode scanning function
  const startScanning = useCallback(async () => {
    setIsScanning(true);
    setCurrentView('scanner');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      // Mock successful scan for demo
      setTimeout(() => {
        mockScanResult();
      }, 2000);
    }
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  const mockScanResult = useCallback(() => {
    const mockProduct = {
      name: "Optimum Nutrition Gold Standard Whey",
      brand: "Optimum Nutrition",
      barcode: "748927022259",
      score: 85,
      proteinContent: 24,
      servingSize: "30g",
      ingredients: [
        { name: "Whey Protein Isolate", type: "good", reason: "High-quality complete protein" },
        { name: "Whey Protein Concentrate", type: "good", reason: "Good protein source with natural nutrients" },
        { name: "Natural Flavors", type: "neutral", reason: "Generally safe flavoring agents" },
        { name: "Lecithin", type: "good", reason: "Natural emulsifier, supports brain health" },
        { name: "Sucralose", type: "warning", reason: "Artificial sweetener, may affect gut bacteria" },
        { name: "Acesulfame Potassium", type: "warning", reason: "Artificial sweetener, some concerns with long-term use" }
      ],
      nutritionHighlights: {
        protein: "24g per serving",
        calories: "120",
        sugar: "1g",
        fat: "1g"
      }
    };
    
    setScanResult(mockProduct);
    setCurrentView('result');
    stopScanning();
    
    // Add to history
    setHistory(prev => [mockProduct, ...prev.slice(0, 9)]);
  }, [stopScanning]);

  const searchProduct = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    // Mock search result
    const mockSearchResult = {
      name: searchQuery,
      brand: "Unknown Brand",
      barcode: "manual-search",
      score: 72,
      proteinContent: 20,
      servingSize: "30g",
      ingredients: [
        { name: "Pea Protein", type: "good", reason: "Plant-based complete protein" },
        { name: "Rice Protein", type: "good", reason: "Complementary amino acid profile" },
        { name: "Artificial Colors", type: "bad", reason: "May cause hyperactivity and allergic reactions" },
        { name: "High Fructose Corn Syrup", type: "bad", reason: "Linked to obesity and metabolic issues" }
      ],
      nutritionHighlights: {
        protein: "20g per serving",
        calories: "140",
        sugar: "8g",
        fat: "2g"
      }
    };
    
    setScanResult(mockSearchResult);
    setCurrentView('result');
    setHistory(prev => [mockSearchResult, ...prev.slice(0, 9)]);
  }, [searchQuery]);

  const getScoreColor = useCallback((score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }, []);

  const getIngredientIcon = useCallback((type) => {
    switch (type) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'bad': return <Shield className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      searchProduct();
    }
  }, [searchProduct]);

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ProteinScan</h1>
            <p className="text-gray-600">Scan & analyze protein products instantly</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={startScanning}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Camera className="w-6 h-6" />
              Scan Barcode
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search product name..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchProduct}
                className="bg-gray-100 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => setCurrentView('history')}
                className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <History className="w-5 h-5" />
                View History ({history.length})
              </button>
            )}
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>Scan protein powders, bars, and supplements</p>
            <p>Get instant ingredient analysis & safety scores</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'scanner') {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <button
              onClick={() => { stopScanning(); setCurrentView('home'); }}
              className="text-white text-lg font-medium"
            >
              ← Cancel
            </button>
          </div>

          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-800 rounded-lg object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-32 border-2 border-white rounded-lg opacity-50"></div>
            </div>
          </div>

          <div className="text-center mt-6 text-white">
            <p className="text-lg font-semibold">Position barcode in frame</p>
            <p className="text-sm opacity-75 mt-2">Camera will automatically detect and scan</p>
          </div>

          <button
            onClick={mockScanResult}
            className="w-full mt-8 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Simulate Scan (Demo)
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'result') {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-white shadow-sm p-4">
          <button
            onClick={() => setCurrentView('home')}
            className="text-blue-600 font-medium"
          >
            ← Back
          </button>
        </div>

        <div className="max-w-md mx-auto p-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="text-center mb-6">
              <div className={`inline-flex px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(scanResult.score)}`}>
                {scanResult.score}/100
              </div>
              <h2 className="text-xl font-bold text-gray-800 mt-3">{scanResult.name}</h2>
              <p className="text-gray-600">{scanResult.brand}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{scanResult.proteinContent}g</p>
                <p className="text-sm text-gray-600">Protein</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-lg font-semibold text-gray-700">{scanResult.nutritionHighlights.calories}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ingredient Analysis</h3>
            
            <div className="space-y-3">
              {scanResult.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                  {getIngredientIcon(ingredient.type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{ingredient.name}</p>
                    <p className="text-sm text-gray-600">{ingredient.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'history') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <button
            onClick={() => setCurrentView('home')}
            className="text-blue-600 font-medium"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-gray-800 mt-2">Scan History</h2>
        </div>

        <div className="max-w-md mx-auto p-4">
          <div className="space-y-3">
            {history.map((product, index) => (
              <div
                key={index}
                onClick={() => { setScanResult(product); setCurrentView('result'); }}
                className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                    <p className="text-sm font-medium text-blue-600">{product.proteinContent}g protein</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(product.score)}`}>
                    {product.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProteinScannerApp;

export default function Home() {
  return <ProteinScannerApp />;
}
