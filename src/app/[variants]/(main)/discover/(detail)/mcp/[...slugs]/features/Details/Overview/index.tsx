import { Collapse } from '@lobehub/ui';
import qs from 'query-string';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import McpList from '../../../../../../(list)/mcp/features/List';
import Title from '../../../../../../features/Title';
import MarkdownRender from '../../../../../features/MakedownRender';
import { useDetailContext } from '../../DetailProvider';
import TagList from './TagList';

const Overview = memo(() => {
  const { t } = useTranslation('discover');
  const { related = [], category, tags = [], description, overview } = useDetailContext();
  return (
    <Flexbox gap={48}>
      <Collapse
        defaultActiveKey={['summary']}
        expandIconPosition={'end'}
        items={[
          {
            children: description,
            key: 'summary',
            label: t('mcp.details.summary.title'),
          },
        ]}
        variant={'outlined'}
      />
      <Flexbox gap={16}>
        {overview?.readme && <MarkdownRender>{overview.readme.trimEnd()}</MarkdownRender>}
        <TagList tags={tags} />
      </Flexbox>
      <Flexbox gap={16}>
        <Title
          more={t('mcp.details.related.more')}
          moreLink={qs.stringifyUrl({
            query: {
              category,
            },
            url: '/discover/mcp',
          })}
        >
          {t('mcp.details.related.listTitle')}
        </Title>
        <McpList data={related} />
      </Flexbox>
    </Flexbox>
  );
});

export default Overview;
