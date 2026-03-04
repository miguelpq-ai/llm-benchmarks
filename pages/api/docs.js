import spec from '../../src/openapi.json';

export default function handler(req, res) {
  res.status(200).json(spec);
}
