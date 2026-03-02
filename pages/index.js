import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import ModelCard from '../components/ModelCard';
import ComparisonTable from '../components/ComparisonTable';

const BenchmarkChart = dynamic(() => import('../components/BenchmarkChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
      <p className="text-gray-400">Loading chart...</p>
    </div>
  ),
});

function timeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export async function getStaticProps() {
  const dataPath = path.join(process.cwd(), 'src', 'data', 'models.json');

  let data = { timestamp: null, models: [] };

  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    // data.json doesn't exist yet — return empty state
  }

  return {
    props: {
      models: data.models || [],
      timestamp: data.timestamp || null,
    },
    revalidate: 3600,
  };
}

export default function Home({ models, timestamp }) {
  if (!models || models.length === 0) {
    return (
      <>
        <Head>
          <title>LLM Benchmarks - Live Performance & Cost Data</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">LLM Benchmarks</h1>
            <p className="text-gray-500 mt-2">Benchmarks are being collected. Check back soon.</p>
          </div>
        </div>
      </>
    );
  }

  const fastestModels = [...models].sort((a, b) => a.ttft_ms - b.ttft_ms).slice(0, 3);
  const cheapestModels = [...models].sort((a, b) => a.cost_output_1m - b.cost_output_1m).slice(0, 3);

  return (
    <>
      <Head>
        <title>LLM Benchmarks - Live Performance & Cost Data</title>
        <meta name="description" content="Real-time LLM benchmarks comparing latency, throughput, and cost across Claude, GPT-4o, Qwen, DeepSeek, and Gemini." />
        <meta property="og:title" content="LLM Benchmarks - Live Performance & Cost Data" />
        <meta property="og:description" content="Compare LLM models by latency, throughput, and cost in real-time." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">LLM Benchmarks</h1>
            <p className="text-gray-500 mt-1">
              Live performance & cost data
              {timestamp && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                  Updated {timeAgo(timestamp)}
                </span>
              )}
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
          {/* Fastest Models */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fastest Models (by TTFT)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fastestModels.map((model, i) => (
                <ModelCard key={model.name} {...model} rank={i + 1} />
              ))}
            </div>
          </section>

          {/* Cheapest Models */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Most Cost-Effective (by output cost)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cheapestModels.map((model, i) => (
                <ModelCard key={model.name} {...model} rank={i + 1} />
              ))}
            </div>
          </section>

          {/* Chart */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Latency vs Cost</h2>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <BenchmarkChart models={models} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Ideal position: bottom-left (low latency, low cost)
            </p>
          </section>

          {/* Comparison Table */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Full Comparison</h2>
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <ComparisonTable models={models} />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
            <p>Data sourced from LMSYS, Anthropic, OpenAI, Together AI, DeepSeek, and Google AI.</p>
            <p className="mt-1">Benchmarks auto-update every 6 hours.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
