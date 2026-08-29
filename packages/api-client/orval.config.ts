import { defineConfig } from 'orval';

export default defineConfig({
  agrimarket: {
    input: {
      target: './openapi/agrimarket.json',
    },
    output: {
      mode: 'single',
      target: './generated/index.ts',
      schemas: './generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      baseUrl: {
        runtime: 'layApiBaseUrl()',
        imports: [
          {
            name: 'layApiBaseUrl',
            importPath: '../src/runtime',
          },
        ],
      },
      override: {
        fetch: {
          // Orval 8.26.0 có bug khi false + forceSuccessResponse=true:
          // generated code tham chiếu *Success nhưng không sinh type.
          // Giữ HTTP response wrapper để forceSuccessResponse hoạt động đúng.
          includeHttpResponseReturnType: true,
          forceSuccessResponse: true,
        },
        query: {
          useQuery: true,
        },
      },
    },
  },
});
