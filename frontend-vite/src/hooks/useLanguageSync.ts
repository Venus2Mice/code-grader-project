/**
 * Language Sync Hook
 * 
 * This hook fetches user's language preference from backend after login
 * and syncs it with the i18n system
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languageAPI, isAuthenticated } from '@/services/api';
import { logger } from '@/lib/logger';

export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const syncLanguagePreference = async () => {
      // Only sync if user is authenticated
      if (!isAuthenticated()) {
        return;
      }

      try {
        const response = await languageAPI.getPreference();
        const userLanguage = response.data.language;

        if (userLanguage && userLanguage !== i18n.language) {
          logger.info('Syncing language preference from backend', { 
            current: i18n.language, 
            backend: userLanguage 
          });
          
          await i18n.changeLanguage(userLanguage);
          localStorage.setItem('i18nextLng', userLanguage);
        }
      } catch (error) {
        logger.error('Failed to fetch language preference from backend', error);
        // Don't throw - let user continue with current language
      }
    };

    syncLanguagePreference();
  }, [i18n]);
}
