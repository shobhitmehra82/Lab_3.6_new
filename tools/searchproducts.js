import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { storefrontRequest } from "../storefrontClient.js";
export const searchProducts = tool(
"search_products",
"Search the store catalog for products matching a text query.",
{ query: z.string().default("") },
async ({ query }) => {
const data = await storefrontRequest(`
query searchProducts($query: String) {
products(first: 5, query: $query) {
edges {
node {
title
priceRange { minVariantPrice { amount currencyCode } }
variants(first: 1) { edges { node { id } } }
}
}
}
}
`, { query });
const output = z.object({
products: z.array(z.object({
title: z.string(), price: z.string(), currency: z.string(), variantId: z.string(),
})),
}).parse({
products: data.products.edges.map((e) => ({
title: e.node.title,
price: e.node.priceRange.minVariantPrice.amount,
currency: e.node.priceRange.minVariantPrice.currencyCode,
variantId: e.node.variants.edges[0]?.node.id ?? "",
})),
});
return { content: [{ type: "text", text: JSON.stringify(output) }] };
}
);