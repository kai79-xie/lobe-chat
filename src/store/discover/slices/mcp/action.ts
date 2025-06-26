import { CategoryItem, CategoryListQuery } from '@lobehub/market-sdk';
import useSWR, { type SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { edgeClient } from '@/libs/trpc/client';
import { DiscoverStore } from '@/store/discover';
import { globalHelpers } from '@/store/global/helpers';
import {
  DiscoverMcpDetail,
  IdentifiersResponse,
  McpListResponse,
  McpQueryParams,
} from '@/types/discover';

export interface MCPAction {
  useMcpCategories: (params: CategoryListQuery) => SWRResponse<CategoryItem[]>;
  useMcpDetail: (params: {
    identifier: string;
    version?: string;
  }) => SWRResponse<DiscoverMcpDetail>;
  useMcpIdentifiers: () => SWRResponse<IdentifiersResponse>;
  useMcpList: (params: McpQueryParams) => SWRResponse<McpListResponse>;
}

export const createMCPSlice: StateCreator<
  DiscoverStore,
  [['zustand/devtools', never]],
  [],
  MCPAction
> = () => ({
  useMcpCategories: (params) => {
    const locale = globalHelpers.getCurrentLanguage();
    return useSWR(
      ['mcp-categories', locale, ...Object.values(params)].join('-'),
      async () =>
        edgeClient.market.getMcpCategories.query({
          ...params,
          locale,
        }),
      {
        revalidateOnFocus: false,
      },
    );
  },

  useMcpDetail: (params) => {
    const locale = globalHelpers.getCurrentLanguage();
    return useSWR(
      ['mcp-detail', locale, ...Object.values(params)].filter(Boolean).join('-'),
      async () => edgeClient.market.getMcpDetail.query({ ...params, locale }),
      {
        revalidateOnFocus: false,
      },
    );
  },

  useMcpIdentifiers: () => {
    return useSWR('mcp-identifiers', async () => edgeClient.market.getMcpIdentifiers.query(), {
      revalidateOnFocus: false,
    });
  },

  useMcpList: (params: any) => {
    const locale = globalHelpers.getCurrentLanguage();
    return useSWR(
      ['mcp-list', locale, ...Object.values(params)].filter(Boolean).join('-'),
      async () =>
        edgeClient.market.getMcpList.query({
          ...params,
          locale,
          page: params.page ? Number(params.page) : 1,
          pageSize: params.pageSize ? Number(params.pageSize) : 21,
        }),
      {
        revalidateOnFocus: false,
      },
    );
  },
});
