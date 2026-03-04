import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

const PROVIDER_COLORS = {
  anthropic: '#f97316',
  openai: '#22c55e',
  together: '#3b82f6',
  deepseek: '#a855f7',
  google: '#ef4444',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900">{data.name}</p>
      <p className="text-gray-600">TTFT: {data.ttft_ms} ms</p>
      <p className="text-gray-600">Cost: ${data.cost_output_1m}/1M tokens</p>
      <p className="text-gray-600">Throughput: {data.throughput_tps} tok/s</p>
    </div>
  );
}

export default function BenchmarkChart({ models }) {
  if (!models || models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400">No benchmark data available</p>
      </div>
    );
  }

  // Group models by provider for color coding
  const providers = [...new Set(models.map(m => m.provider))];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          dataKey="ttft_ms"
          name="TTFT"
          domain={['auto', 'auto']}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        >
          <Label value="TTFT (ms)" position="bottom" offset={10} style={{ fill: '#374151', fontSize: 13 }} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="cost_output_1m"
          name="Cost"
          domain={['auto', 'auto']}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        >
          <Label value="$/1M output tokens" angle={-90} position="insideLeft" offset={-5} style={{ fill: '#374151', fontSize: 13 }} />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />
        {providers.map(provider => (
          <Scatter
            key={provider}
            name={provider}
            data={models.filter(m => m.provider === provider)}
            fill={PROVIDER_COLORS[provider] || '#6b7280'}
            shape={(props) => {
              const { cx, cy, fill } = props;
              return <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.85} />;
            }}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
