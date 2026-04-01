---
"counterfact": minor
---

Add `.agent` REPL command with DSL parser and interpreter for context operations.

Users can now execute context operations directly in the REPL using a safe,
constrained DSL:

```
.agent context.checkout.fail = true
.agent context.store.addPet({ "type": "cat" })
.agent --debug context.store.reset()
```

The DSL supports property assignments (`context.path = value`) and method calls
(`context.path(args)`), and explicitly disallows unsafe constructs such as
`eval`, `new`, `require`, `import`, and computed property access.
