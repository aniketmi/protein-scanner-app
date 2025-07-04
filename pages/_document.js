import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Basic Meta Tags */}
        <meta name="description" content="Scan and analyze protein products instantly with barcode scanning and ingredient analysis. Get nutrition facts, safety scores, and ingredient breakdowns." />
        <meta name="keywords" content="protein scanner, nutrition facts, barcode scanner, ingredient analysis, protein powder, supplements, health, fitness" />
        <meta name="author" content="ProteinScan" />
        
        {/* PWA Primary Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="background-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon Links */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/*<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />*/}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        
        {/* Apple Mobile Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ProteinScan" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Apple Splash Screens */}
        {/*<link rel="apple-touch-startup-image" href="/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)" />*/}
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ProteinScan" />
        
        {/* Open Graph Meta Tags (for social sharing) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ProteinScan - Nutrition Scanner" />
        <meta property="og:description" content="Scan and analyze protein products instantly with barcode scanning and ingredient analysis" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:url" content="https://protein-scanner-app.vercel.app" />
        <meta property="og:site_name" content="ProteinScan" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ProteinScan - Nutrition Scanner" />
        <meta name="twitter:description" content="Scan and analyze protein products instantly with barcode scanning and ingredient analysis" />
        <meta name="twitter:image" content="/icon-512.png" />
        
        {/* Performance and Security */}
        <link rel="preconnect" href="https://world.openfoodfacts.org" />
        <link rel="dns-prefetch" href="https://world.openfoodfacts.org" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Viewport Meta Tag (Critical for mobile) */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        
        {/* Prevent search engine indexing during development (remove in production) */}
        {/* <meta name="robots" content="noindex, nofollow" /> */}
        
        {/* Schema.org JSON-LD for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ProteinScan",
              "description": "Scan and analyze protein products instantly with barcode scanning and ingredient analysis",
              "url": "https://protein-scanner-app.vercel.app",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "ProteinScan"
              }
            })
          }}
        />
      </Head>
      <body>
        {/* No-script fallback */}
        <noscript>
          <div style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '16px'
          }}>
            ProteinScan requires JavaScript to function properly. Please enable JavaScript in your browser.
          </div>
        </noscript>
        
        <Main />
        <NextScript />
        
        {/* Service Worker Registration (Alternative method if needed) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />
      </body>
    </Html>
  )
}
