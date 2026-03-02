import { useState } from 'react';

const COLUMNS = [
  { key: 'name', label: 'Model', sortable: false },
  { key: 'provider', label: 'Provider', sortable: false },
  { key: 'ttft_ms', label: 'TTFT (ms)', sortable: true },
  { key: 'throughput_tps', label: 'Throughput (tok/s)', sortable: true },
  { key: 'cost_input_1m', label: 'Input $/1M', sortable: true },
  { key: 'cost_output_1m', label: 'Output $/1M', sortable: true },
  { key: 'json_support', label: 'JSON', sortable: false },
];

const PROVIDER_COLORS = {
  anthropic: 'text-orange-600',
  openai: 'text-green-600',
  together: 'text-blue-600',
  deepseek: 'text-purple-600',
  google: 'text-red-600',
};

export default function ComparisonTable({ models }) {
  const [sortKey, setSortKey] = useState('ttft_ms');
  const [sortAsc, setSortAsc] = useState(true);

  if (!models || models.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const sorted = [...models].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`py-3 px-4 text-left font-semibold text-gray-600 ${col.sortable ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span className="ml-1">{sortAsc ? '\u2191' : '\u2193'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((model, i) => (
            <tr
              key={model.name}
              className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <td className="py-3 px-4 font-medium text-gray-900">{model.name}</td>
              <td className={`py-3 px-4 font-medium ${PROVIDER_COLORS[model.provider] || 'text-gray-600'}`}>
                {model.provider}
              </td>
              <td className="py-3 px-4 tabular-nums">{model.ttft_ms}</td>
              <td className="py-3 px-4 tabular-nums">{model.throughput_tps}</td>
              <td className="py-3 px-4 tabular-nums">${model.cost_input_1m}</td>
              <td className="py-3 px-4 tabular-nums">${model.cost_output_1m}</td>
              <td className="py-3 px-4">
                <span className={`inline-block w-2 h-2 rounded-full ${model.json_support ? 'bg-green-500' : 'bg-red-400'}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
