const RANK_STYLES = {
  1: { badge: 'bg-yellow-400 text-yellow-900', label: '1st' },
  2: { badge: 'bg-gray-300 text-gray-700', label: '2nd' },
  3: { badge: 'bg-amber-600 text-white', label: '3rd' },
};

const PROVIDER_COLORS = {
  anthropic: 'bg-orange-100 text-orange-700',
  openai: 'bg-green-100 text-green-700',
  together: 'bg-blue-100 text-blue-700',
  deepseek: 'bg-purple-100 text-purple-700',
  google: 'bg-red-100 text-red-700',
};

function getLatencyColor(ms) {
  if (ms < 100) return 'text-green-600';
  if (ms < 200) return 'text-yellow-600';
  return 'text-red-600';
}

export default function ModelCard({
  name,
  provider,
  ttft_ms,
  throughput_tps,
  cost_input_1m,
  cost_output_1m,
  json_support,
  sources,
  rank,
}) {
  const rankStyle = RANK_STYLES[rank];
  const providerColor = PROVIDER_COLORS[provider] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 relative">
      {rankStyle && (
        <span className={`absolute -top-2 -right-2 ${rankStyle.badge} text-xs font-bold px-2 py-1 rounded-full`}>
          {rankStyle.label}
        </span>
      )}

      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mt-1 ${providerColor}`}>
        {provider}
      </span>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">TTFT</p>
          <p className={`text-lg font-bold ${getLatencyColor(ttft_ms)}`}>
            {ttft_ms} <span className="text-sm font-normal">ms</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Throughput</p>
          <p className="text-lg font-bold text-gray-800">
            {throughput_tps} <span className="text-sm font-normal">tok/s</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Input Cost</p>
          <p className="text-sm font-semibold text-gray-700">
            ${cost_input_1m}/1M
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Output Cost</p>
          <p className="text-sm font-semibold text-gray-700">
            ${cost_output_1m}/1M
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${json_support ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          JSON {json_support ? 'Supported' : 'N/A'}
        </span>
        {sources && sources.length > 0 && (
          <span className="text-xs text-gray-400">
            {sources.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
