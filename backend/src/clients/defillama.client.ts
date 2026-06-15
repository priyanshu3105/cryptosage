import axios from "axios";
import { env } from "../config/env";

const client = axios.create({
  baseURL: "https://api.llama.fi",
  timeout: env.EXTERNAL_API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

export const defillamaClient = {
  async getProtocols() {
    const { data } = await client.get("/protocols");
    return data;
  },

  async getProtocol(slug: string) {
    const { data } = await client.get(`/protocol/${slug}`);
    return data;
  },

  async getTVL(slug: string) {
    const { data } = await client.get(`/tvl/${slug}`);
    return data;
  },

  async getChains() {
    const { data } = await client.get("/v2/chains");
    return data;
  },
};
