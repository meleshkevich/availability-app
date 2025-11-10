module.exports = {
  models: [{
    name: "openai-gpt4o",
    title: "OpenAI GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY 
  }],
  defaultModel: "openai-gpt4o",
  contextProviders: [
    {
      name: "repo",
      params: {
        root: ".",
        include: ["pages", "server/api", "composables", "components", "store"]
      }
    },
    {
      name: "editor",
      params: {}
    },
    {
      name: "terminal",
      params: {}
    }
  ],
  experimental: {
    autoContext: true
  },
  allowAnonymousTelemetry: false,
  maxContextTokens: 16000
};

