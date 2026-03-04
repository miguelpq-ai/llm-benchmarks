import Head from 'next/head';
import { useEffect } from 'react';

export default function DocsPage() {
  useEffect(() => {
    // Initialize Swagger UI once the CDN scripts have loaded
    const interval = setInterval(() => {
      if (window.SwaggerUIBundle) {
        clearInterval(interval);
        window.SwaggerUIBundle({
          url: '/api/docs',
          dom_id: '#swagger-ui',
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: 'StandaloneLayout',
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>API Documentation - LLM Benchmarks</title>
        <meta name="description" content="LLM Benchmarks API documentation" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" defer />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" defer />
      </Head>
      <div id="swagger-ui" style={{ minHeight: '100vh' }} />
    </>
  );
}
