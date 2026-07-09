import { createClient } from "@insforge/sdk";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  console.log("FETCH URL:", args[0]);
  return originalFetch(...args);
};

const insforge = createClient({
  baseUrl: "https://ahnx8ffi.us-east.insforge.app",
  anonKey: "ik_1e5aeea802927f5c980fbff88c869a7c",
});

async function run() {
  const { data, error } = await insforge.database.from("investigations").select("*");
  console.log("Data:", data);
}
run();
