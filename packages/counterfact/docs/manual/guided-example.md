# Try the guided coffee shop

Learn Counterfact by editing a running API and observing the app use it. The bundled coffee shop works without an OpenAPI document of your own.

## Start the example

For an interactive introduction, run:

```sh
npx counterfact@latest
```

With no arguments and no `counterfact.yaml`, choose **Try a guided example**
(the default) or **Use my OpenAPI document**. Documentation is also available.

The guided example opens **Counterfact Coffee** in your browser. Instructions
stay on the left; the working shop is on the right, in equal-width columns. The walkthrough is designed
for a desktop browser window at least 1100px wide. Keep Counterfact running
in its terminal and make file changes in your own editor.

Before starting, Counterfact shows the new `counterfact-demo/` directory and
local server address. Press Enter to start, `p` to change the port, or `b` to
go back. Existing directories are preserved by choosing a new numbered name.
The example uses bundled files and needs no contract download.

## Change behavior and observe the shop

The walkthrough starts with a normal purchase, then guides you through:

1. Making sold-out Decaf available by editing `routes/products.ts`.
2. Making orders fail, preserving the cart, and restoring successful retries.
3. Adding an inventory update to `routes/orders.ts`: subtract each purchased
   quantity from `$.context.inventory`.
4. Buying the remaining Dark Roast stock and seeing the shop mark it sold out.
5. Inspecting and replenishing that same inventory through the REPL:

   ```js
   context.inventory["dark-roast"];
   context.inventory["dark-roast"] = 5;
   ```

6. Making another purchase and seeing five bags become four.

The walkthrough has eight screens. Related phases share one lesson: making
Decaf available and buying it; failing and retrying an order; observing unchanged
stock and adding inventory subtraction; restocking through the REPL and buying
from that inventory. Instructions advance automatically within each lesson;
**Continue** moves between concepts. The displayed quantities are guided examples:
other positive whole-number stock values and fulfilled purchase quantities also
work. Inventory lessons verify that the purchased quantity is subtracted.

Follow the instructions beside the real shop. Open **Show code hint** when you
want the exact file or example edit. File names and displayed file paths in the
instructions open the corresponding file in VSCode. The instructions bold the next action. Cart changes and successful orders move
the emphasis automatically. Saved lesson files are detected automatically and their
handlers are called with fresh test inventory. A passing check moves the emphasis
to trying the change in the shop; an unexpected response or broken handler shows
an alert explaining the mismatch. Fix the code and save again to rerun the check.
Test orders do not consume the shop’s inventory or affect its cart.
The REPL commands are shown directly; restocking is detected from the product
response, without confirmation buttons. Saved-file checks do not replace the
shopper actions required to complete the lesson.

## Recover and revisit lessons

Product cards use shopper-facing messages such as **4 bags available** or
**Sold out**, without exposing where inventory is stored. Adding bags changes the cart and availability
immediately; reducing a quantity or removing an item restores availability.
Only the API reports inventory changes after purchases or context updates.
If the products response fails or contains invalid stock, cards show **Availability temporarily unavailable** and buying pauses until a fresh response arrives. Stock rejections
show the requested and available quantities reported by the order API. Missing
order confirmations are labeled unknown rather than rejected; the cart is kept.

The shop checks the products API automatically while visible and after each
order. Saved inventory edits and REPL changes appear without a manual refresh.
Changing feedback appears under a small **Update** label, separate from the
lesson instructions. Background API checks run without a status feed or clock. Saving a file alone
does not complete a task. **Continue** moves on after success; **Back** and **Skip lesson** let you control the pace. A browser reload
keeps the current lesson and cart within the same running API session. Back also
keeps your edited handlers and inventory; if an exercise needs stock, its
instructions show the REPL command to restore it without resetting your files.

## Work in your editor

Use the instructional file links to open files in VSCode through the `vscode://`
URL scheme, or **Copy file path** beside the edit instruction to find a file in another editor.
The adjacent **Open in VSCode** link names its destination explicitly; code hints
remain optional. Shared inventory is declared in `routes/_.context.ts` and initialized
by `scenarios/index.ts`; products and orders access the same running object.
The initial order handler intentionally does not reduce stock until you add
that operation. No payments or real purchases take place. The final screen offers an optional
challenge: make another coffee unavailable, verify the shopper’s experience,
then restore it without a hint. The same workflow applies to your own API.

The shop and REPL remain running after completion, and your files remain after
quitting. If a browser cannot be opened, use the walkthrough URL printed in the
terminal. The final panel prints the command to restart the project.

## Use your own API

To use your own document, choose it from discovered local OpenAPI files or
enter a path or URL, then choose an output directory and available port.
Use `q`, Ctrl+C, or Ctrl+D to cancel setup before creating files.

If you already have a config file or pass any arguments, Counterfact uses its
usual startup behavior. In CI or without interactive input and output,
an unconfigured no-argument run prints guidance and exits. Pass a spec
explicitly for scripts, or `_` to start without OpenAPI.

## Continue learning

- [Generate an API from OpenAPI](../getting-started.md) — apply the workflow to your own API.
- [First 10 minutes](../first-10-minutes.md) — build a small create/read workflow.
- [CLI and configuration](../api/cli.md#first-run-intro) — setup, discovery limits, and unattended startup.
