const loadConfig = ({ nodeEnv, syncHost }) => {
  const saved = { ...process.env };
  process.env.NODE_ENV = nodeEnv;
  if (syncHost === undefined) delete process.env.REACT_APP_SYNC_API_HOST;
  else process.env.REACT_APP_SYNC_API_HOST = syncHost;
  let loaded;
  jest.isolateModules(() => {
    loaded = require("./config");
  });
  process.env = saved;
  return loaded;
};

describe("sync server address", () => {
  it("falls back to the local sync server in development and tests", () => {
    const { config, isSyncConfigured } = loadConfig({
      nodeEnv: "development",
    });

    expect(config.REACT_APP_SYNC_API_HOST).toBe("http://localhost:4000");
    expect(isSyncConfigured()).toBe(true);
  });

  it("uses the configured address", () => {
    const { config, isSyncConfigured } = loadConfig({
      nodeEnv: "production",
      syncHost: "https://sync.example.com",
    });

    expect(config.REACT_APP_SYNC_API_HOST).toBe("https://sync.example.com");
    expect(isSyncConfigured()).toBe(true);
  });

  it("has no sync server in a production build made without an address", () => {
    const { config, isSyncConfigured } = loadConfig({ nodeEnv: "production" });

    expect(config.REACT_APP_SYNC_API_HOST).toBe("");
    expect(isSyncConfigured()).toBe(false);
  });
});
