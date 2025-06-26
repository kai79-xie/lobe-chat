'use client';

import { TextArea } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Loader2, Palette, Sparkles } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useImageStore } from '@/store/image';
import { createImageSelectors } from '@/store/image/selectors';
import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

interface PromptInputProps {
  showTitle?: boolean;
  disableAnimation?: boolean;
}

const useStyles = createStyles(({ css, token, responsive }) => ({
  wrapper: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  `,
  header: css`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  `,
  icon: css`
    width: 40px;
    height: 40px;
    background: transparent;
    border-radius: ${token.borderRadius}px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    font-size: ${token.fontSizeXL}px;
    font-weight: 600;
    color: ${token.colorText};
    margin: 0;
  `,
  container: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG * 2}px;
    box-shadow: 0 2px 8px ${token.colorFillTertiary};
    background-color: ${token.colorFillTertiary};
    width: 100%;

    /* Default for desktop and larger screens */
    max-width: 680px;
    padding: 8px 12px 8px 20px;

    /* Overrides for smaller screens */
    ${responsive.laptop} {
      max-width: 600px;
    }

    ${responsive.tablet} {
      max-width: 90%;
    }
  `,
  textArea: css`
    flex: 1;
    border: none;
    box-shadow: none;
    border-radius: 0;
    background-color: transparent;
    font-size: ${token.fontSizeLG}px;
    line-height: 1.6;
    padding: 8px 0;

    &::placeholder {
      color: ${token.colorTextTertiary};
    }

    &:hover,
    &:focus,
    &:active {
      box-shadow: none;
      border: none;
      background-color: transparent !important;
    }

    ${responsive.mobile} {
      font-size: ${token.fontSize}px;
      padding: 6px 0;
    }
  `,
}));

const useButtonStyles = () =>
  createStyles(({ css, token, responsive }) => ({
    generateButton: css`
      background: #ffffff;
      border: none;
      border-radius: ${token.borderRadius * 1.5}px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${token.fontSize}px;
      font-weight: 600;
      color: #000000;
      transition: all 0.2s ease;
      min-height: 54px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      ${responsive.mobile} {
        padding: 10px 16px;
        min-height: 50px;
        font-size: ${token.fontSizeSM}px;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      &:not(:disabled) {
        cursor: pointer;
      }
    `,
  }));

const PromptInput = ({ showTitle = false, disableAnimation = false }: PromptInputProps) => {
  const { styles } = useStyles();
  const { styles: buttonStyles } = useButtonStyles()();
  const { t } = useTranslation('image');
  const { value, setValue } = useGenerationConfigParam('prompt');
  const isCreating = useImageStore(createImageSelectors.isCreating);
  const createImage = useImageStore((s) => s.createImage);

  const handleGenerate = async () => {
    await createImage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isCreating && value.trim()) {
        handleGenerate();
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      {showTitle && (
        <div className={styles.header}>
          <div className={styles.icon}>
            <Palette size={24} />
          </div>
          <h2 className={styles.title}>{t('config.title')}</h2>
        </div>
      )}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className={styles.container}
        initial={disableAnimation ? undefined : { opacity: 0, scale: 0.8 }}
        transition={
          disableAnimation
            ? undefined
            : {
                duration: 0.5,
                ease: [0.175, 0.885, 0.32, 1.275],
                type: 'spring',
                damping: 15,
                stiffness: 300,
              }
        }
      >
        <Flexbox align="center" gap={12} height={'100%'} horizontal width={'100%'}>
          <TextArea
            className={`resize-textarea ${styles.textArea}`}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('config.prompt.placeholder')}
            resize
            rows={2}
            value={value}
          />
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            initial={disableAnimation ? undefined : { opacity: 0, scale: 0.8 }}
            transition={disableAnimation ? undefined : { delay: 0.2, duration: 0.4 }}
            whileHover={
              !disableAnimation && !isCreating && value.trim()
                ? { scale: 1.05, transition: { duration: 0.15 } }
                : {}
            }
            whileTap={!disableAnimation && !isCreating && value.trim() ? { scale: 0.95 } : {}}
          >
            <motion.button
              className={buttonStyles.generateButton}
              disabled={isCreating || !value.trim()}
              onClick={handleGenerate}
              whileHover={
                !disableAnimation && !isCreating && value.trim()
                  ? {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                    }
                  : {}
              }
            >
              <motion.div
                animate={isCreating && !disableAnimation ? {} : { rotate: 0 }}
                transition={
                  disableAnimation
                    ? undefined
                    : {
                        duration: 1,
                        repeat: 0,
                        ease: 'linear',
                      }
                }
              >
                {isCreating ? <Loader2 size={18} /> : <Sparkles size={18} />}
              </motion.div>
              <span>
                {isCreating ? t('generation.status.generating') : t('generation.actions.generate')}
              </span>
            </motion.button>
          </motion.div>
        </Flexbox>
      </motion.div>
    </div>
  );
};

export default PromptInput;
