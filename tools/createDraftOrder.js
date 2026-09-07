import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { adminRequest } from "../adminClient.js";
import { askConfirmation } from "../confirm.js";
export const createDraftOrder = tool(
"create_draft_order",
"Create a draft order for a product variant and return its invoice link. " +
"Requires the user's explicit y/n confirmation before it creates anything.",
{ variantId: z.string(), quantity: z.number().int().positive().default(1) },
async ({ variantId, quantity }) => {
const confirmed = await askConfirmation(
`Create a draft order for ${quantity}x ${variantId}? (y/n) `
);
if (!confirmed) {
return {
content: [{ type: "text", text: "Declined: the draft order was not created." }],
is_error: true,
};
}
const data = await adminRequest(`
mutation createDraftOrder($variantId: ID!, $quantity: Int!) {
draftOrderCreate(input: { lineItems: [{ variantId: $variantId, quantity: $quantity }] }) {
draftOrder { id invoiceUrl }
userErrors { field message }
}
}
`, { variantId, quantity });
if (data.draftOrderCreate.userErrors.length) {
return {
content: [{ type: "text", text: JSON.stringify(data.draftOrderCreate.userErrors) }],
is_error: true,
};
}
const output = z.object({ invoiceUrl: z.string().url() })
.parse({ invoiceUrl: data.draftOrderCreate.draftOrder.invoiceUrl });
return { content: [{ type: "text", text: JSON.stringify(output) }] };CommentHighlight
}
);