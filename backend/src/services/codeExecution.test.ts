import assert from "node:assert/strict";
import test from "node:test";
import { executeCode } from "./codeExecution.js";

test("rejects unsupported execution languages", async () => {
  const result = await executeCode("print('hello')", "ruby", "");

  assert.deepEqual(result, {
    output: "",
    error: "Unsupported language : ruby",
  });
});