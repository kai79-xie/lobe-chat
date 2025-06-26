import qs from 'query-string';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import List from '../../../../../../(list)/plugin/features/List';
import Title from '../../../../../../features/Title';
import { useDetailContext } from '../../DetailProvider';

const Related = memo(() => {
  const { t } = useTranslation('discover');
  const { related, category } = useDetailContext();
  return (
    <Flexbox gap={16}>
      <Title
        more={t('plugins.details.related.more')}
        moreLink={qs.stringifyUrl({
          query: {
            category,
          },
          url: '/discover/plugin',
        })}
      >
        {t('plugins.details.related.listTitle')}
      </Title>
      <List data={related} />
    </Flexbox>
  );
});

export default Related;
