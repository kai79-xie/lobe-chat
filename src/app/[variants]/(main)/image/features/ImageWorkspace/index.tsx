'use client';

import { useQueryState } from 'nuqs';

import EmptyLayout from './EmptyLayout';
import ImageWorkspaceContent from './ImageWorkspaceContent';

const ImageWorkspace = () => {
  const [topic] = useQueryState('topic');

  // 如果没有 topic 参数，显示空状态布局
  if (!topic) {
    return <EmptyLayout />;
  }

  // 有 topic 参数时显示主要内容
  return <ImageWorkspaceContent />;
};

export default ImageWorkspace;
