import { StateCreator } from 'zustand';

import { imageService } from '@/services/image';
import { AsyncTaskStatus } from '@/types/asyncTask';
import { Generation, GenerationBatch } from '@/types/generation';

import { ImageStore } from '../../store';
import { generationBatchSelectors } from '../generationBatch/selectors';
import { imageGenerationConfigSelectors } from '../generationConfig/selectors';
import { generationTopicSelectors } from '../generationTopic';

// ====== action interface ====== //

export interface CreateImageAction {
  createImage: () => Promise<void>;
  /**
   * eg: invalid api key, recreate image
   */
  recreateImage: (generationBatchId: string) => Promise<void>;
}

// ====== helper functions ====== //

const createTempBatch = (
  provider: string,
  model: string,
  prompt: string,
  config: any,
  imageNum: number,
  width?: number | null,
  height?: number | null,
): GenerationBatch => {
  const tempBatchId = `temp-${Date.now()}`;
  const tempGenerations: Generation[] = [];

  // Create temporary generations based on imageNum
  for (let i = 0; i < imageNum; i++) {
    tempGenerations.push({
      id: `temp-gen-${Date.now()}-${i}`,
      asset: null,
      seed: null,
      createdAt: new Date(),
      asyncTaskId: null,
      task: {
        id: `temp-task-${Date.now()}-${i}`,
        status: AsyncTaskStatus.Pending,
      },
    } as Generation);
  }

  return {
    id: tempBatchId,
    provider,
    model,
    prompt,
    width: width || null,
    height: height || null,
    config,
    createdAt: new Date(),
    generations: tempGenerations,
  };
};

// ====== action implementation ====== //

export const createCreateImageSlice: StateCreator<
  ImageStore,
  [['zustand/devtools', never]],
  [],
  CreateImageAction
> = (set, get) => ({
  async createImage() {
    set({ isCreating: true }, false, 'createImage/startCreateImage');

    const store = get();
    const imageNum = imageGenerationConfigSelectors.imageNum(store);
    const parameters = imageGenerationConfigSelectors.parameters(store);
    const provider = imageGenerationConfigSelectors.provider(store);
    const model = imageGenerationConfigSelectors.model(store);
    const activeGenerationTopicId = generationTopicSelectors.activeGenerationTopicId(store);
    const { createGenerationTopic, switchGenerationTopic, addOptimisticGenerationBatch } = store;

    if (!parameters) {
      throw new TypeError('parameters is not initialized');
    }

    if (!parameters.prompt) {
      throw new TypeError('prompt is empty');
    }

    // 1. Create generation topic if not exists
    let generationTopicId = activeGenerationTopicId;
    if (!generationTopicId) {
      const prompts = [parameters.prompt];
      generationTopicId = await createGenerationTopic(prompts);

      // 2. Optimistic update BEFORE switching topic to avoid skeleton screen
      const tempBatch = createTempBatch(
        provider,
        model,
        parameters.prompt!,
        parameters,
        imageNum,
        parameters.width,
        parameters.height,
      );

      // Add temporary batch to UI (optimistic update)
      addOptimisticGenerationBatch(generationTopicId, tempBatch);

      // 3. Switch to the new topic (now it has data, so no skeleton screen)
      switchGenerationTopic(generationTopicId);
    } else {
      // 2. For existing topic, just add optimistic batch
      const tempBatch = createTempBatch(
        provider,
        model,
        parameters.prompt!,
        parameters,
        imageNum,
        parameters.width,
        parameters.height,
      );

      // Add temporary batch to UI (optimistic update)
      addOptimisticGenerationBatch(generationTopicId, tempBatch);
    }

    try {
      // 3. Create image via service
      await imageService.createImage({
        generationTopicId,
        provider,
        model,
        imageNum,
        params: parameters as any,
      });

      // 4. Refresh generation batches to show the real data
      await get().refreshGenerationBatches();
    } finally {
      set({ isCreating: false }, false, 'createImage/endCreateImage');
    }
  },

  async recreateImage(generationBatchId: string) {
    set({ isCreating: true }, false, 'recreateImage/startCreateImage');

    const store = get();
    const imageNum = imageGenerationConfigSelectors.imageNum(store);
    const activeGenerationTopicId = generationTopicSelectors.activeGenerationTopicId(store);
    const batch = generationBatchSelectors.getGenerationBatchByBatchId(generationBatchId)(store)!;
    const { removeGenerationBatch, addOptimisticGenerationBatch } = store;

    if (!activeGenerationTopicId) {
      throw new Error('No active generation topic');
    }

    // 1. Delete generation batch
    await removeGenerationBatch(generationBatchId, activeGenerationTopicId);

    // 2. Optimistic update - create temporary batch
    const tempBatch = createTempBatch(
      batch.provider,
      batch.model,
      batch.prompt,
      batch.config,
      imageNum,
      batch.width,
      batch.height,
    );

    // Add temporary batch to UI (optimistic update)
    addOptimisticGenerationBatch(activeGenerationTopicId, tempBatch);

    try {
      // 3. Create image via service
      await imageService.createImage({
        generationTopicId: activeGenerationTopicId,
        provider: batch.provider,
        model: batch.model,
        imageNum,
        params: batch.config as any,
      });

      // 4. Refresh generation batches to show the real data
      await store.refreshGenerationBatches();
    } finally {
      set({ isCreating: false }, false, 'recreateImage/endCreateImage');
    }
  },
});
