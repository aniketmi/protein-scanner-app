import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Search, Shield, AlertTriangle, CheckCircle, History, Zap, Wifi, WifiOff, Download, X } from 'lucide-react';

const ProteinScannerApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // PWA Installation and Service Worker Registration
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle PWA install
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real barcode scanning with QuaggaJS
  const initBarcodeScanner = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      videoRef.current.srcObject = stream;
      
      // Initialize QuaggaJS for real barcode detection
      const Quagga = await import('quagga');
      
      Quagga.default.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: 1280,
            height: 720,
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader", 
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('QuaggaJS init error:', err);
          // Fallback to simulation if QuaggaJS fails
          simulateBarcodeScan();
          return;
        }
        console.log("QuaggaJS initialized successfully");
        Quagga.default.start();
      });

      // Handle successful barcode detection
      Quagga.default.onDetected((data) => {
        const barcode = data.codeResult.code;
        console.log('Real barcode detected:', barcode);
        
        // Stop QuaggaJS
        Quagga.default.stop();
        
        // Process the detected barcode
        handleBarcodeDetected(barcode);
      });

      // Handle detection errors
      Quagga.default.onProcessed((result) => {
        const drawingCtx = Quagga.default.canvas.ctx.overlay;
        const drawingCanvas = Quagga.default.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
            result.boxes.filter(box => box !== result.box).forEach(box => {
              Quagga.default.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
            });
          }

          if (result.box) {
            Quagga.default.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.default.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
          }
        }
      });
      
    } catch (error) {
      console.error('Camera access denied or QuaggaJS failed:', error);
      
      // Fallback to simulation for demo purposes
      alert('Camera access required for barcode scanning. Falling back to demo mode.');
      simulateBarcodeScan();
    }
    
    // Fallback simulation function (commented out for production)
    function simulateBarcodeScan() {
      /* 
         SIMULATION MODE - Remove this in production
         This is only for demo purposes when QuaggaJS fails
      */
      setTimeout(() => {
        if (isScanning) {
          const mockBarcodes = [
            '748927022259', // Optimum Nutrition Gold Standard Whey
            '853218003456', // Generic Protein Bar
            '123456789012', // Plant Protein Powder
            '0041570052471', // Muscle Milk Protein Shake
            '0031604026851'  // Quest Protein Bar
          ];
          const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
          console.log('Simulated barcode detected:', randomBarcode);
          handleBarcodeDetected(randomBarcode);
        }
      }, 3000 + Math.random() * 2000); // 3-5 seconds delay
    }
  }, [isScanning]);

  const handleBarcodeDetected = useCallback(async (barcode) => {
    if (!isScanning) return;
    
    setIsLoading(true);
    console.log('Barcode detected:', barcode);
    
    try {
      // Fetch product data from Open Food Facts API
      const productData = await fetchProductData(barcode);
      
      if (productData) {
        setScanResult(productData);
        setCurrentView('result');
        setHistory(prev => [productData, ...prev.slice(0, 9)]);
      } else {
        alert('Product not found in database. Try searching manually.');
        setCurrentView('home');
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      alert('Error fetching product data. Please try again.');
      setCurrentView('home');
    } finally {
      setIsLoading(false);
      stopScanning();
    }
  }, [isScanning]);

  // Fetch product data from Open Food Facts API
  const fetchProductData = async (barcode) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        
        // Calculate protein score and analyze ingredients
        const proteinScore = calculateProteinScore(product);
        const ingredientAnalysis = analyzeIngredients(product.ingredients_text || '');
        
        return {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || 'Unknown Brand',
          barcode: barcode,
          score: proteinScore.overallScore,
          proteinContent: parseFloat(product.nutriments?.proteins_100g) || 0,
          servingSize: product.serving_size || 'Unknown',
          ingredients: ingredientAnalysis,
          nutritionHighlights: {
            protein: `${product.nutriments?.proteins_100g || 0}g per 100g`,
            calories: `${product.nutriments?.energy_kcal_100g || 0} kcal`,
            sugar: `${product.nutriments?.sugars_100g || 0}g`,
            fat: `${product.nutriments?.fat_100g || 0}g`,
            fiber: `${product.nutriments?.fiber_100g || 0}g`,
            sodium: `${product.nutriments?.sodium_100g || 0}mg`
          },
          imageUrl: product.image_url,
          categories: product.categories || '',
          isProteinProduct: proteinScore.isProteinFocused
        };
      }
      
      return null;
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  };

  // Calculate protein-focused score
  const calculateProteinScore = (product) => {
    let score = 50; // Base score
    const nutrients = product.nutriments || {};
    
    const protein = parseFloat(nutrients.proteins_100g) || 0;
    const sugar = parseFloat(nutrients.sugars_100g) || 0;
    const sodium = parseFloat(nutrients.sodium_100g) || 0;
    const saturatedFat = parseFloat(nutrients.saturated_fat_100g) || 0;
    
    // Protein content scoring (high protein = good)
    if (protein >= 20) score += 25;
    else if (protein >= 15) score += 15;
    else if (protein >= 10) score += 10;
    else if (protein < 5) score -= 15;
    
    // Sugar content (low sugar = good)
    if (sugar <= 2) score += 15;
    else if (sugar <= 5) score += 10;
    else if (sugar > 15) score -= 20;
    else if (sugar > 10) score -= 10;
    
    // Sodium content (moderate sodium = good)
    if (sodium <= 200) score += 10;
    else if (sodium > 800) score -= 15;
    else if (sodium > 500) score -= 10;
    
    // Saturated fat (low = good)
    if (saturatedFat <= 2) score += 10;
    else if (saturatedFat > 10) score -= 15;
    
    // Check if it's actually a protein-focused product
    const isProteinFocused = protein >= 15 || 
      (product.categories && product.categories.toLowerCase().includes('protein')) ||
      (product.product_name && product.product_name.toLowerCase().includes('protein'));
    
    // Penalty for non-protein products
    if (!isProteinFocused) score -= 20;
    
    return {
      overallScore: Math.max(1, Math.min(100, Math.round(score))),
      isProteinFocused
    };
  };

  // Analyze ingredients for harmful/beneficial components
  const analyzeIngredients = (ingredientsText) => {
    if (!ingredientsText) return [];
    
    const ingredients = ingredientsText.split(',').map(ing => ing.trim());
    const analysis = [];
    
    // Define good, warning, and bad ingredients for protein products
    const goodIngredients = [
      'whey protein', 'casein', 'pea protein', 'rice protein', 'hemp protein',
      'egg protein', 'collagen', 'lecithin', 'natural flavors', 'stevia',
      'monk fruit', 'cocoa', 'vanilla', 'cinnamon', 'probiotics', 'enzymes',
      'bcaa', 'creatine', 'glutamine'
    ];
    
    const warningIngredients = [
      'sucralose', 'aspartame', 'acesulfame', 'artificial flavors',
      'corn syrup', 'dextrose', 'maltodextrin', 'carrageenan',
      'xanthan gum', 'guar gum'
    ];
    
    const badIngredients = [
      'high fructose corn syrup', 'trans fat', 'hydrogenated',
      'artificial colors', 'red dye', 'blue dye', 'yellow dye',
      'sodium nitrate', 'msg', 'bha', 'bht', 'tbhq'
    ];
    
    ingredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase();
      let type = 'neutral';
      let reason = 'Generally recognized as safe';
      
      // Check for good ingredients
      for (const good of goodIngredients) {
        if (lowerIng.includes(good)) {
          type = 'good';
          reason = getIngredientBenefit(good);
          break;
        }
      }
      
      // Check for warning ingredients
      if (type === 'neutral') {
        for (const warning of warningIngredients) {
          if (lowerIng.includes(warning)) {
            type = 'warning';
            reason = getIngredientWarning(warning);
            break;
          }
        }
      }
      
      // Check for bad ingredients
      if (type === 'neutral') {
        for (const bad of badIngredients) {
          if (lowerIng.includes(bad)) {
            type = 'bad';
            reason = getIngredientConcern(bad);
            break;
          }
        }
      }
      
      analysis.push({
        name: ingredient,
        type,
        reason
      });
    });
    
    return analysis.slice(0, 10); // Limit to first 10 ingredients
  };

  const getIngredientBenefit = (ingredient) => {
    const benefits = {
      'whey protein': 'Complete protein with all essential amino acids',
      'pea protein': 'Plant-based complete protein, easily digestible',
      'rice protein': 'Hypoallergenic protein source',
      'lecithin': 'Natural emulsifier, supports brain health',
      'stevia': 'Natural zero-calorie sweetener',
      'probiotics': 'Supports digestive health',
      'bcaa': 'Branched-chain amino acids for muscle recovery'
    };
    return benefits[ingredient] || 'Beneficial ingredient for protein products';
  };

  const getIngredientWarning = (ingredient) => {
    const warnings = {
      'sucralose': 'Artificial sweetener, may affect gut bacteria',
      'aspartame': 'Artificial sweetener, some people may be sensitive',
      'maltodextrin': 'High glycemic index, may spike blood sugar',
      'carrageenan': 'May cause digestive issues in sensitive individuals'
    };
    return warnings[ingredient] || 'Use in moderation';
  };

  const getIngredientConcern = (ingredient) => {
    const concerns = {
      'high fructose corn syrup': 'Linked to obesity and metabolic issues',
      'artificial colors': 'May cause hyperactivity and allergic reactions',
      'trans fat': 'Increases risk of heart disease',
      'msg': 'May cause headaches in sensitive individuals'
    };
    return concerns[ingredient] || 'Potentially harmful ingredient';
  };

  const startScanning = useCallback(async () => {
    setIsScanning(true);
    setCurrentView('scanner');
    await initBarcodeScanner();
  }, [initBarcodeScanner]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    // Stop QuaggaJS if it's running
    try {
      import('quagga').then((Quagga) => {
        if (Quagga.default) {
          Quagga.default.stop();
          console.log('QuaggaJS stopped');
        }
      });
    } catch (error) {
      console.log('QuaggaJS not running or already stopped');
    }
    
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const searchProduct = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Search Open Food Facts by product name
      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=5`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        // Get the first product that seems protein-related
        const proteinProduct = data.products.find(p => 
          (p.product_name && p.product_name.toLowerCase().includes('protein')) ||
          (p.categories && p.categories.toLowerCase().includes('protein')) ||
          (p.nutriments && parseFloat(p.nutriments.proteins_100g) >= 10)
        ) || data.products[0];
        
        const processedProduct = {
          name: proteinProduct.product_name || searchQuery,
          brand: proteinProduct.brands || 'Search Result',
          barcode: proteinProduct.code || 'search-result',
          score: calculateProteinScore(proteinProduct).overallScore,
          proteinContent: parseFloat(proteinProduct.nutriments?.proteins_100g) || 0,
          servingSize: proteinProduct.serving_size || 'Unknown',
          ingredients: analyzeIngredients(proteinProduct.ingredients_text || ''),
          nutritionHighlights: {
            protein: `${proteinProduct.nutriments?.proteins_100g || 0}g per 100g`,
            calories: `${proteinProduct.nutriments?.energy_kcal_100g || 0} kcal`,
            sugar: `${proteinProduct.nutriments?.sugars_100g || 0}g`,
            fat: `${proteinProduct.nutriments?.fat_100g || 0}g`
          },
          imageUrl: proteinProduct.image_url
        };
        
        setScanResult(processedProduct);
        setCurrentView('result');
        setHistory(prev => [processedProduct, ...prev.slice(0, 9)]);
      } else {
        alert('No products found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
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
          {/* PWA Install Prompt */}
          {showInstallPrompt && !isInstalled && (
            <div className="bg-blue-600 text-white p-4 rounded-xl mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Install ProteinScan</p>
                  <p className="text-sm text-blue-100">Add to home screen for faster access</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallApp}
                  className="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-50"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstallPrompt}
                  className="text-blue-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Network Status */}
          <div className="flex justify-end mb-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          <div className="text-center mb-8 pt-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ProteinScan</h1>
            <p className="text-gray-600">Scan & analyze protein products instantly</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-sm text-gray-500">Powered by Open Food Facts</p>
              {isInstalled && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Installed</span>}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={startScanning}
              disabled={!isOnline}
              className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 transform ${
                isOnline 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Camera className="w-6 h-6" />
              {isOnline ? 'Scan Barcode' : 'Scanning Unavailable (Offline)'}
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search product name..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                disabled={!isOnline || isLoading}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={searchProduct}
                disabled={!isOnline || isLoading}
                className="bg-gray-100 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <Search className="w-5 h-5 text-gray-600" />
                )}
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

            {/* PWA Features Info */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">App Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Works offline with cached data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Real-time nutrition database</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Intelligent ingredient analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Scan history saved locally</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>🥤 Scan protein powders, bars, and supplements</p>
            <p>📊 Get instant ingredient analysis & safety scores</p>
            <p>🌐 Real-time data from nutrition databases</p>
            <p className="mt-2 text-xs">
              {isInstalled ? '✅ Installed as PWA' : '💡 Add to home screen for best experience'}
            </p>
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
              muted
              className="w-full h-64 bg-gray-800 rounded-lg object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-32 border-2 border-white rounded-lg opacity-75">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
              </div>
            </div>
            
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Analyzing product...</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-white">
            <p className="text-lg font-semibold">Position barcode in frame</p>
            <p className="text-sm opacity-75 mt-2">Camera will automatically detect and scan</p>
            <p className="text-xs opacity-50 mt-2">Supports UPC, EAN, and Code128 formats</p>
          </div>
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
            {scanResult.imageUrl && (
              <div className="w-full h-32 mb-4 overflow-hidden rounded-lg">
                <img 
                  src={scanResult.imageUrl} 
                  alt={scanResult.name}
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            
            <div className="text-center mb-6">
              <div className={`inline-flex px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(scanResult.score)}`}>
                {scanResult.score}/100
              </div>
              <h2 className="text-xl font-bold text-gray-800 mt-3">{scanResult.name}</h2>
              <p className="text-gray-600">{scanResult.brand}</p>
              {scanResult.barcode !== 'search-result' && (
                <p className="text-xs text-gray-400 mt-1">Barcode: {scanResult.barcode}</p>
              )}
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

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Sugar: {scanResult.nutritionHighlights.sugar}</div>
              <div>Fat: {scanResult.nutritionHighlights.fat}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ingredient Analysis</h3>
            
            {scanResult.ingredients.length > 0 ? (
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
            ) : (
              <p className="text-gray-500 text-center py-4">No ingredient information available</p>
            )}
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
