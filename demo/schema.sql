-- Schema for the Algolia apparel sample dataset.
-- Run this in the Supabase SQL Editor BEFORE importing the CSV.
--
-- Why not let the CSV import create the table? Type inference would store the JSON
-- columns as text and would not make objectID a primary key -- and the connector
-- requires objectID as the primary key.
--
-- Data: https://raw.githubusercontent.com/algolia/quickstarts/main/sample-data/apparel.csv
-- Import it into this table with Supabase's Table Editor > Insert > Import data from CSV.

create table if not exists public.apparel (
  -- Quoted to preserve the capital D. Postgres folds unquoted identifiers to
  -- lowercase, which would leave the column as `objectid` and stop both the CSV
  -- header and the connector transformation from matching it.
  "objectID" text primary key,
  title text not null,
  description text not null,
  product_type text not null,
  price numeric(10, 2) not null,
  showcase_image text,
  color jsonb,
  hierarchical_categories jsonb,
  tags jsonb,
  taxable boolean not null default true,
  units_sold integer,
  weight numeric(10, 2)
);
