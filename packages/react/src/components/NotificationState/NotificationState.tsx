/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { INotification } from '@magicbell/react-headless';

import { useTheme } from '../../context/MagicBellThemeContext';
import DotIcon from '../icons/DotIcon';

export interface Props {
  notification: INotification;
  menuPlacement?:
    | 'auto'
    | 'auto-start'
    | 'auto-end'
    | 'top'
    | 'bottom'
    | 'right'
    | 'left'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'right-start'
    | 'right-end'
    | 'left-start'
    | 'left-end';
}

/**
 * Component that renders a dot with style based on notification state
 *
 * @example
 * <NotificationState notification={notification} />
 */
export default function NotificationState({ notification }: Props) {
  const { notification: themeVariants } = useTheme();

  const theme = !notification.isSeen
    ? themeVariants.unseen
    : !notification.isRead
    ? themeVariants.unread
    : themeVariants.default;

  return (
    <div
      css={css`
        flex: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        color: ${theme.state.color} !important;
      `}
    >
      <DotIcon />
    </div>
  );
}
