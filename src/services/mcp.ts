import { PluginManifest } from '@lobehub/market-sdk';

import { isDesktop } from '@/const/version';
import { desktopClient, edgeClient, toolsClient } from '@/libs/trpc/client';
import { ChatToolPayload } from '@/types/message';
import { CheckMcpInstallResult } from '@/types/plugins';
import { CustomPluginMetadata } from '@/types/tool/plugin';
import { cleanObject } from '@/utils/object';

class MCPService {
  async invokeMcpToolCall(payload: ChatToolPayload, { signal }: { signal?: AbortSignal }) {
    const { pluginSelectors } = await import('@/store/tool/selectors');
    const { getToolStoreState } = await import('@/store/tool/store');

    const s = getToolStoreState();
    const { identifier, arguments: args, apiName } = payload;

    const installPlugin = pluginSelectors.getInstalledPluginById(identifier)(s);
    const customPlugin = pluginSelectors.getCustomPluginById(identifier)(s);

    const plugin = installPlugin || customPlugin;

    if (!plugin) return;

    const data = {
      args,
      params: { ...plugin.customParams?.mcp, name: identifier } as any,
      toolName: apiName,
    };

    const isStdio = plugin?.customParams?.mcp?.type === 'stdio';

    // For desktop and stdio, use the desktopClient
    if (isDesktop && isStdio) {
      return desktopClient.mcp.callTool.mutate(data, { signal });
    }

    return toolsClient.mcp.callTool.mutate(data, { signal });
  }

  async getStreamableMcpServerManifest(
    identifier: string,
    url: string,
    metadata?: CustomPluginMetadata,
  ) {
    return toolsClient.mcp.getStreamableMcpServerManifest.query({ identifier, metadata, url });
  }

  async getStdioMcpServerManifest(
    stdioParams: {
      args?: string[];
      command: string;
      env?: Record<string, string>;
      name: string;
    },
    metadata?: CustomPluginMetadata,
  ) {
    return desktopClient.mcp.getStdioMcpServerManifest.query({ ...stdioParams, metadata });
  }

  /**
   * 检查 MCP 插件安装状态
   * @param manifest MCP 插件清单
   * @returns 安装检测结果
   */
  async checkInstallation(manifest: PluginManifest): Promise<CheckMcpInstallResult> {
    try {
      // 确保有部署选项
      if (!manifest.deploymentOptions?.length) {
        return {
          error: '未找到有效的部署选项',
          success: false,
        };
      }

      // 将所有部署选项传递给主进程进行检查
      return desktopClient.mcp.validMcpServerInstallable.mutate({
        deploymentOptions: manifest.deploymentOptions as any,
      });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '未知错误',
        success: false,
      };
    }
  }

  /**
   * 上报 MCP 插件安装结果
   */
  reportMcpInstallResult = ({
    identifier,
    version,
    installDurationMs,
    success,
    manifest,
    error,
  }: {
    error?: string;
    identifier: string;
    installDurationMs?: number;
    manifest?: any;
    success: boolean;
    version?: string;
  }) => {
    const reportData = {
      error: success ? undefined : error,
      identifier,
      installDurationMs,
      manifest: success ? manifest : undefined,
      success,
      version,
    };
    console.log('reportData:', reportData);

    edgeClient.market.reportMcpInstallResult
      .mutate(cleanObject(reportData))
      .catch((reportError) => {
        console.warn('Failed to report MCP installation result:', reportError);
      });
  };
}

export const mcpService = new MCPService();
