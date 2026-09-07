import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { storefrontRequest } from "../storefrontClient.js";
export const createCartWithItem = tool(
"create_cart_with_item",
"Create a cart and add one product variant to it. Returns a checkout link.",
{ variantId: z.string(), quantity: z.number().int().positive().default(1) },
async ({ variantId, quantity }) => {
const created = await storefrontRequest(
`mutation { cartCreate { cart { id } } }`
);
const added = await storefrontRequest(`
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
cartLinesAdd(cartId: $cartId, lines: $lines) {
cart { checkoutUrl }
userErrors { field message }
}
}
`, { cartId: created.cartCreate.cart.id, lines: [{ merchandiseId: variantId, quantity }] });
if (added.cartLinesAdd.userErrors.length) {
return {
content: [{ type: "text", text: JSON.stringify(added.cartLinesAdd.userErrors) }],
is_error: true,
};
}
const output = z.object({ checkoutUrl: z.string().url() })
.parse({ checkoutUrl: added.cartLinesAdd.cart.checkoutUrl });
return { content: [{ type: "text", text: JSON.stringify(output) }] };
}
);