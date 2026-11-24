CREATE TABLE country_visits (
  country TEXT PRIMARY KEY NOT NULL CHECK (country GLOB '[A-Z][A-Z]'),
  views INTEGER NOT NULL CHECK (views > 0),
  first_seen INTEGER NOT NULL
) STRICT;
