import { DeploymentOption, SystemDependency } from '@lobehub/market-sdk';
import debug from 'debug';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import {
  InstallationChecker,
  PackageInstallCheckResult,
  SystemDependencyCheckResult,
} from './types';

const execPromise = promisify(exec);
const log = debug('lobe-mcp:deps-check');

/**
 * MCP System Dependency Check Service
 */

class MCPSystemDepsCheckService {
  private checkers: Map<string, InstallationChecker> = new Map();

  /**
   * Register installation checker
   */
  registerChecker(method: string, checker: InstallationChecker) {
    this.checkers.set(method, checker);
    log(`Installation checker registered: ${method}`);
  }

  /**
   * Check system dependency version
   */
  async checkSystemDependency(dependency: SystemDependency): Promise<SystemDependencyCheckResult> {
    try {
      // If check command not provided, use generic command
      const checkCommand = dependency.checkCommand || `${dependency.name} --version`;
      log(`Checking system dependency: ${dependency.name}, command: ${checkCommand}`);

      const { stdout, stderr } = await execPromise(checkCommand);
      if (stderr && !stdout) {
        return {
          error: stderr,
          installed: false,
          meetRequirement: false,
          name: dependency.name,
        };
      }

      const output = stdout.trim();
      let version = output;

      // Process version parsing
      if (dependency.versionParsingRequired) {
        // Extract version number - usually in format vX.Y.Z or X.Y.Z
        const versionMatch = output.match(/[Vv]?(\d+(\.\d+)*)/);
        if (versionMatch) {
          version = versionMatch[0];
        }
      }

      let meetRequirement = true;

      if (dependency.requiredVersion) {
        // Extract numeric part
        const currentVersion = version.replace(/^[Vv]/, ''); // Remove possible v prefix
        const currentVersionNum = parseFloat(currentVersion);

        // Extract condition and number from required version
        const requirementMatch = dependency.requiredVersion.match(/([<=>]+)?(\d+(\.\d+)*)/);

        if (requirementMatch) {
          const [, operator = '=', requiredVersion] = requirementMatch;
          const requiredNum = parseFloat(requiredVersion);

          switch (operator) {
            case '>=': {
              meetRequirement = currentVersionNum >= requiredNum;
              break;
            }
            case '>': {
              meetRequirement = currentVersionNum > requiredNum;
              break;
            }
            case '<=': {
              meetRequirement = currentVersionNum <= requiredNum;
              break;
            }
            case '<': {
              meetRequirement = currentVersionNum < requiredNum;
              break;
            }
            default: {
              // Default equals
              meetRequirement = currentVersionNum === requiredNum;
              break;
            }
          }
        }
      }

      log(
        `System dependency check result: ${dependency.name}, installed: ${true}, meets requirement: ${meetRequirement}, version: ${version}`,
      );
      return {
        installed: true,
        meetRequirement,
        name: dependency.name,
        version,
      };
    } catch (error) {
      log(`System dependency check error: ${dependency.name}, ${error}`);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        installed: false,
        meetRequirement: false,
        name: dependency.name,
      };
    }
  }

  /**
   * Check deployment option
   */
  async checkDeployOption(option: DeploymentOption): Promise<{
    allDependenciesMet: boolean;
    connection: any;
    isRecommended?: boolean;
    packageInstalled: boolean;
    systemDependencies: SystemDependencyCheckResult[];
  }> {
    const systemDependenciesResults: SystemDependencyCheckResult[] = [];

    // Check system dependencies
    if (option.systemDependencies && option.systemDependencies.length > 0) {
      for (const dep of option.systemDependencies) {
        const result = await this.checkSystemDependency(dep);
        systemDependenciesResults.push(result);
      }
    }

    // Get corresponding installation checker
    const checker = this.checkers.get(option.installationMethod);
    let packageInstalled = false;
    let packageResult: PackageInstallCheckResult | null = null;

    if (checker) {
      // Use specific installation checker to check package installation status
      packageResult = await checker.checkPackageInstalled(option.installationDetails);
      packageInstalled = packageResult.installed;
    } else {
      log(`Installation checker not found: ${option.installationMethod}`);
    }

    // Check if all system dependencies meet requirements
    const allDependenciesMet = systemDependenciesResults.every((dep) => dep.meetRequirement);

    // Create connection info
    const connection = option.connection.url
      ? {
          ...option.connection,
          type: 'http',
        }
      : {
          ...option.connection,
          type: 'stdio',
        };

    return {
      allDependenciesMet,
      connection,
      isRecommended: option.isRecommended,
      packageInstalled,
      systemDependencies: systemDependenciesResults,
    };
  }
}

// Create singleton instance
export const mcpSystemDepsCheckService = new MCPSystemDepsCheckService();
