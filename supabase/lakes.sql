-- Run in Supabase SQL Editor. Foundation for weather (and later: map, alerts, lake-scoped threads).
-- Coordinates are lake-approximate — weather model resolution is ~10 km, so precision doesn't matter.

CREATE TABLE IF NOT EXISTS lakes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text UNIQUE NOT NULL,
  county     text,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lakes ENABLE ROW LEVEL SECURITY;

-- Public reference data: readable without a session (the weather API route reads with the anon key)
CREATE POLICY "Anyone can read lakes" ON lakes FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS lakes_name_idx ON lakes (lower(name));

INSERT INTO lakes (name, county, lat, lng) VALUES
  ('Houghton Lake',    'Roscommon',      44.315, -84.765),
  ('Higgins Lake',     'Roscommon',      44.482, -84.755),
  ('Torch Lake',       'Antrim',         44.972, -85.311),
  ('Elk Lake',         'Antrim',         44.852, -85.373),
  ('Lake Charlevoix',  'Charlevoix',     45.284, -85.191),
  ('Burt Lake',        'Cheboygan',      45.472, -84.663),
  ('Mullett Lake',     'Cheboygan',      45.512, -84.510),
  ('Black Lake',       'Cheboygan',      45.463, -84.276),
  ('Glen Lake',        'Leelanau',       44.870, -85.980),
  ('Lake Leelanau',    'Leelanau',       44.983, -85.712),
  ('Crystal Lake',     'Benzie',         44.657, -86.163),
  ('Long Lake',        'Grand Traverse', 44.717, -85.750),
  ('Hubbard Lake',     'Alcona',         44.770, -83.550),
  ('Hamlin Lake',      'Mason',          44.050, -86.420),
  ('Lake Cadillac',    'Wexford',        44.247, -85.435),
  ('Lake Mitchell',    'Wexford',        44.238, -85.474),
  ('Lake Missaukee',   'Missaukee',      44.320, -85.300),
  ('Silver Lake',      'Oceana',         43.660, -86.490),
  ('White Lake',       'Muskegon',       43.380, -86.350),
  ('Gull Lake',        'Kalamazoo',      42.398, -85.411),
  ('Gun Lake',         'Barry',          42.610, -85.510),
  ('Paw Paw Lake',     'Berrien',        42.213, -86.271),
  ('Diamond Lake',     'Cass',           41.870, -85.970),
  ('Coldwater Lake',   'Branch',         41.833, -85.020),
  ('Devils Lake',      'Lenawee',        41.977, -84.283),
  ('Wamplers Lake',    'Lenawee',        42.048, -84.222),
  ('Clark Lake',       'Jackson',        42.121, -84.349),
  ('Lake Fenton',      'Genesee',        42.828, -83.709),
  ('Lobdell Lake',     'Genesee',        42.755, -83.820),
  ('Lake Chemung',     'Livingston',     42.622, -83.880),
  ('Whitmore Lake',    'Washtenaw',      42.432, -83.752),
  ('Portage Lake',     'Washtenaw',      42.421, -83.921),
  ('Walled Lake',      'Oakland',        42.538, -83.480),
  ('Cass Lake',        'Oakland',        42.603, -83.363),
  ('Orchard Lake',     'Oakland',        42.583, -83.393),
  ('Union Lake',       'Oakland',        42.610, -83.440),
  ('Pontiac Lake',     'Oakland',        42.670, -83.460),
  ('Lake Gogebic',     'Gogebic',        46.490, -89.590),
  ('Lake Michigamme',  'Marquette',      46.530, -88.120),
  ('Indian Lake',      'Schoolcraft',    45.980, -86.340),
  ('Manistique Lake',  'Luce',           46.240, -85.720)
ON CONFLICT (name) DO NOTHING;
