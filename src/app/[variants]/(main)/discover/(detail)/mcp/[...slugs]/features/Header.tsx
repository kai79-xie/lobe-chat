'use client';

import { Github } from '@lobehub/icons';
import { ActionIcon, Avatar, Button, Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { createStyles, useResponsive } from 'antd-style';
import { CircleIcon, DotIcon, DownloadIcon, ScaleIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import qs from 'query-string';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useCategory } from '../../../../(list)/mcp/features/Category/useCategory';
import InstallationIcon from '../../../../features/InstallationIcon';
import PublishedTime from '../../../../features/PublishedTime';
import { useDetailContext } from './DetailProvider';
import Scores from './Scores';
import { getLanguageColor, getRecommendedDeployment } from './utils';

const useStyles = createStyles(({ css, token }) => {
  return {
    desc: css`
      color: ${token.colorTextSecondary};
    `,
    time: css`
      font-size: 12px;
      color: ${token.colorTextDescription};
    `,
    version: css`
      font-family: ${token.fontFamilyCode};
      font-size: 13px;
    `,
  };
});

const Header = memo<{ mobile?: boolean }>(({ mobile: isMobile }) => {
  const {
    name,
    author,
    version,
    identifier,
    icon,
    updatedAt,
    createdAt,
    github,
    isValidated,
    promptsCount,
    resourcesCount,
    toolsCount,
    deploymentOptions = [],
    category,
    installCount,
    overview,
    isClaimed,
  } = useDetailContext();
  const { styles, theme } = useStyles();
  const { mobile = isMobile } = useResponsive();

  const recommendedDeployment = getRecommendedDeployment(deploymentOptions);
  const categories = useCategory();
  const cate = categories.find((c) => c.key === category);

  const scores = (
    <Scores
      deploymentOptions={deploymentOptions}
      github={github}
      identifier={identifier as string}
      isClaimed={isClaimed}
      isValidated={isValidated}
      overview={overview}
      promptsCount={promptsCount}
      resourcesCount={resourcesCount}
      toolsCount={toolsCount}
    />
  );

  const cateButton = (
    <Link
      href={qs.stringifyUrl({
        query: { category: cate?.key },
        url: '/discover/mcp',
      })}
    >
      <Button icon={cate?.icon} size={'middle'} variant={'outlined'}>
        {cate?.label}
      </Button>
    </Link>
  );

  return (
    <Flexbox gap={12}>
      <Flexbox align={'flex-start'} gap={16} horizontal width={'100%'}>
        <Avatar avatar={icon} size={mobile ? 48 : 64} />
        <Flexbox
          flex={1}
          gap={4}
          style={{
            overflow: 'hidden',
          }}
        >
          <Flexbox
            align={'center'}
            gap={8}
            horizontal
            justify={'space-between'}
            style={{
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Flexbox
              align={'center'}
              flex={1}
              gap={12}
              horizontal
              style={{
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Typography.Title
                ellipsis={{ rows: 1 }}
                level={1}
                style={{ fontSize: mobile ? 18 : 24, margin: 0 }}
                title={identifier}
              >
                {name}
              </Typography.Title>
              {!mobile && scores}
            </Flexbox>
            <Flexbox align={'center'} gap={6} horizontal>
              {recommendedDeployment?.installationMethod && (
                <InstallationIcon type={recommendedDeployment.installationMethod} />
              )}
              {github?.url && (
                <Link href={github.url} onClick={(e) => e.stopPropagation()} target={'_blank'}>
                  <ActionIcon fill={theme.colorTextDescription} icon={Github} />
                </Link>
              )}
            </Flexbox>
          </Flexbox>
          <Flexbox align={'center'} gap={4} horizontal>
            <div className={styles.version}>{version}</div>
            <Icon icon={DotIcon} />
            {author?.url ? (
              <Link href={author?.url} target={'_blank'}>
                {author?.name}
              </Link>
            ) : (
              <span>{author?.name}</span>
            )}
            <Icon icon={DotIcon} />
            <PublishedTime
              className={styles.time}
              date={(updatedAt || createdAt) as string}
              template={'MMM DD, YYYY'}
            />
          </Flexbox>
        </Flexbox>
      </Flexbox>
      <Flexbox
        align={'center'}
        gap={mobile ? 12 : 24}
        horizontal
        style={{
          color: theme.colorTextSecondary,
        }}
      >
        {mobile && scores}
        {!mobile && cateButton}
        {Boolean(github?.language) && (
          <Flexbox align={'center'} gap={6} horizontal>
            <Icon
              color={theme.colorFillTertiary}
              fill={getLanguageColor(github?.language)}
              icon={CircleIcon}
              size={12}
            />
            {github?.language}
          </Flexbox>
        )}
        {Boolean(github?.license) && (
          <Flexbox align={'center'} gap={6} horizontal>
            <Icon icon={ScaleIcon} size={14} />
            {github?.license}
          </Flexbox>
        )}
        {Boolean(installCount) && (
          <Flexbox align={'center'} gap={6} horizontal>
            <Icon icon={DownloadIcon} size={14} />
            {installCount}
          </Flexbox>
        )}
        {Boolean(github?.stars) && (
          <Flexbox align={'center'} gap={6} horizontal>
            <Icon icon={StarIcon} size={14} />
            {github?.stars}
          </Flexbox>
        )}
      </Flexbox>
    </Flexbox>
  );
});

export default Header;
