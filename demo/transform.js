// Canonical copy of the code pasted into the Algolia dashboard transformation editor
// (Data sources > Connectors > Supabase > Transformation).
//
// Allow-list: returns only the attributes the search UI renders. weight, taxable,
// color, tags and hierarchical_categories are left out because nothing displays them.
// Add them back if you extend the UI -- hierarchical_categories in particular suits
// InstantSearch HierarchicalMenu.
//
// price_range is DERIVED here from price. It is not a column in Supabase and not an
// Algolia index setting; without this function the price facet has nothing to show.
async function transform(record, helper) {
  const price = Number(record.price);

  return {
    objectID: String(record.objectID),
    title: record.title,
    description: record.description,
    product_type: record.product_type,
    price,
    price_range: priceRange(price),
    showcase_image: record.showcase_image ?? null,
    // Not displayed, but kept: the index ranks by desc(units_sold). Strip it and that
    // customRanking criterion silently stops having any effect.
    units_sold: record.units_sold == null ? null : Number(record.units_sold),
  };
}

// Buckets must match PRICE_RANGE_ORDER in src/App.tsx, which controls their display
// order in the sidebar.
function priceRange(price) {
  if (price < 25) return "Under $25";
  if (price < 50) return "$25 to $49";
  if (price < 100) return "$50 to $99";
  return "$100 and up";
}
