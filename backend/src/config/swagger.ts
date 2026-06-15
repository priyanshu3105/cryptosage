import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CryptoSage Backend API",
      version: "1.0.0",
      description: "Interactive API documentation for the CryptoSage backend.",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                requestId: { type: "string" },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth" },
      { name: "Portfolio" },
      { name: "Market" },
      { name: "DeFi" },
      { name: "Chat" },
      { name: "Health" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "Hardi" },
                    email: { type: "string", example: "hardi@example.com" },
                    password: { type: "string", example: "StrongPass123" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "User registered successfully" },
            "400": { description: "Validation error" },
            "409": { description: "User already exists" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user and return JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "hardi@example.com" },
                    password: { type: "string", example: "StrongPass123" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Login successful" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user returned" },
            "401": { description: "Authentication required" },
          },
        },
        delete: {
          tags: ["Auth"],
          summary: "Delete current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "User deleted" },
            "401": { description: "Authentication required" },
          },
        },
      },
      "/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change current user password",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["currentPassword", "newPassword"],
                  properties: {
                    currentPassword: { type: "string", example: "StrongPass123" },
                    newPassword: { type: "string", example: "NewStrongPass123" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password changed" },
            "401": { description: "Authentication required or invalid current password" },
          },
        },
      },
      "/portfolio": {
        post: {
          tags: ["Portfolio"],
          summary: "Create portfolio",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Main Portfolio" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Portfolio created" },
          },
        },
        get: {
          tags: ["Portfolio"],
          summary: "Get current user portfolio",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Portfolio returned" },
          },
        },
        put: {
          tags: ["Portfolio"],
          summary: "Update portfolio name",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Long-Term Portfolio" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Portfolio updated" },
          },
        },
      },
      "/portfolio/holdings": {
        post: {
          tags: ["Portfolio"],
          summary: "Add holding to portfolio",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["coinId", "quantity", "buyPrice"],
                  properties: {
                    coinId: { type: "string", example: "bitcoin" },
                    symbol: { type: "string", example: "BTC" },
                    name: { type: "string", example: "Bitcoin" },
                    quantity: { type: "number", example: 0.5 },
                    buyPrice: { type: "number", example: 60000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Holding added" },
          },
        },
      },
      "/portfolio/holdings/{holdingId}": {
        put: {
          tags: ["Portfolio"],
          summary: "Update holding",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "holdingId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    quantity: { type: "number", example: 0.75 },
                    buyPrice: { type: "number", example: 58000 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Holding updated" },
          },
        },
        delete: {
          tags: ["Portfolio"],
          summary: "Delete holding",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "holdingId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Holding deleted" },
          },
        },
      },
      "/market/top": {
        get: {
          tags: ["Market"],
          summary: "Get top market coins",
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", example: 10 },
            },
          ],
          responses: {
            "200": { description: "Top market coins returned" },
          },
        },
      },
      "/market/price/{coinId}": {
        get: {
          tags: ["Market"],
          summary: "Get current market price for a coin",
          parameters: [
            {
              name: "coinId",
              in: "path",
              required: true,
              schema: { type: "string", example: "bitcoin" },
            },
          ],
          responses: {
            "200": { description: "Coin price returned" },
          },
        },
      },
      "/market/history/{coinId}": {
        get: {
          tags: ["Market"],
          summary: "Get coin market history",
          parameters: [
            {
              name: "coinId",
              in: "path",
              required: true,
              schema: { type: "string", example: "bitcoin" },
            },
            {
              name: "range",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["7d", "30d"] },
            },
          ],
          responses: {
            "200": { description: "Coin history returned" },
          },
        },
      },
      "/defi/protocols": {
        get: {
          tags: ["DeFi"],
          summary: "Get DeFi protocols",
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", example: 15 },
            },
          ],
          responses: {
            "200": { description: "Protocols returned" },
          },
        },
      },
      "/defi/protocols/{slug}": {
        get: {
          tags: ["DeFi"],
          summary: "Get DeFi protocol detail",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string", example: "aave" },
            },
          ],
          responses: {
            "200": { description: "Protocol detail returned" },
          },
        },
      },
      "/defi/protocols/{slug}/tvl": {
        get: {
          tags: ["DeFi"],
          summary: "Get protocol TVL history",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string", example: "aave" },
            },
            {
              name: "range",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["30d", "90d", "180d"] },
            },
          ],
          responses: {
            "200": { description: "TVL history returned" },
          },
        },
      },
      "/chat": {
        post: {
          tags: ["Chat"],
          summary: "Ask the CryptoSage assistant",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message", "mode"],
                  properties: {
                    message: { type: "string", example: "What is TVL in DeFi?" },
                    mode: { type: "string", enum: ["market", "defi", "auto"], example: "defi" },
                    sessionId: { type: "string", example: "session-12345" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Chat response returned" },
          },
        },
      },
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Backend health check",
          responses: {
            "200": { description: "Health status returned" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
