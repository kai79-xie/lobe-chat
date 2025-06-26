import { PluginItem, PluginListResponse, PluginQueryParams } from '@lobehub/market-sdk';
import { PluginItemDetail } from '@lobehub/market-types';

export enum McpCategory {
  All = 'all',
  Business = 'business',
  Developer = 'developer',
  GamingEntertainment = 'gaming-entertainment',
  HealthWellness = 'health-wellness',
  Lifestyle = 'lifestyle',
  MediaGenerate = 'media-generate',
  News = 'news',
  Productivity = 'productivity',
  ScienceEducation = 'science-education',
  Social = 'social',
  StocksFinance = 'stocks-finance',
  Tools = 'tools',
  TravelTransport = 'travel-transport',
  Weather = 'weather',
  WebSearch = 'web-search',
}

export enum McpSorts {
  CreatedAt = 'createdAt',
  InstallCount = 'installCount',
  IsFeatured = 'isFeatured',
  IsValidated = 'isValidated',
  RatingCount = 'ratingCount',
  UpdatedAt = 'updatedAt',
}

export enum McpNavKey {
  Deployment = 'deployment',
  Overview = 'overview',
  Related = 'related',
  Schema = 'schema',
  Score = 'score',
  Version = 'version',
}

export type DiscoverMcpItem = PluginItem;

export type McpQueryParams = PluginQueryParams;

export type McpListResponse = PluginListResponse;

export interface DiscoverMcpDetail extends PluginItemDetail {
  isClaimed?: boolean;
  related: DiscoverMcpItem[];
}
