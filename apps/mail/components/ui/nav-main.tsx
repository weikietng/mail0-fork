'use client';

import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './sidebar';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePathname, useSearchParams } from 'next/navigation';
import { clearBulkSelectionAtom } from '../mail/use-mail';
import { useFeaturebase } from '@/hooks/use-featurebase';
import { type MessageKey } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { useStats } from '@/hooks/use-stats';
import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { BASE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import * as React from 'react';
import Link from 'next/link';
import {type NavItem} from '@/config/navigation'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  ref?: React.Ref<SVGSVGElement>;
  startAnimation?: () => void;
  stopAnimation?: () => void;
}

interface NavItemProps extends NavItem {
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  suffix?: React.ComponentType<IconProps>;
  isSettingsPage?: boolean;
}

interface NavMainProps {
  items: {
    title: string;
    items: NavItemProps[];
    isActive?: boolean;
  }[];
}

type IconRefType = SVGSVGElement & {
  startAnimation?: () => void;
  stopAnimation?: () => void;
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Validates URLs to prevent open redirect vulnerabilities.
   * Only allows two types of URLs:
   * 1. Absolute paths that start with '/' (e.g., '/mail', '/settings')
   * 2. Full URLs that match our application's base URL
   *
   * @param url - The URL to validate
   * @returns boolean - True if the URL is internal and safe to use
   */
  const isValidInternalUrl = useCallback((url: string) => {
    if (!url) return false;
    // Accept absolute paths as they are always internal
    if (url.startsWith('/')) return true;
    try {
      const urlObj = new URL(url, BASE_URL);
      // Prevent redirects to external domains by checking against our base URL
      return urlObj.origin === BASE_URL;
    } catch {
      return false;
    }
  }, []);

  const getHref = useCallback(
    (item: NavItemProps) => {
      // Get the current 'from' parameter
      const currentFrom = searchParams.get('from');
      const category = searchParams.get('category');

      // Handle Featurebase button
      if (item.isFeaturebaseButton) {
        return '#';
      }

      // Handle settings navigation
      if (item.isSettingsButton) {
        // Include current path with category query parameter if present
        const currentPath = category
          ? `${pathname}?category=${encodeURIComponent(category)}`
          : pathname;
        return `${item.url}?from=${encodeURIComponent(currentPath)}`;
      }

      // Handle back button with redirect protection
      if (item.isBackButton) {
        if (currentFrom) {
          const decodedFrom = decodeURIComponent(currentFrom);
          if (isValidInternalUrl(decodedFrom)) {
            return decodedFrom;
          }
        }
        // Fall back to safe default if URL is missing or invalid
        return '/mail';
      }

      // Handle settings pages navigation
      if (item.isSettingsPage && currentFrom) {
        // Validate and sanitize the 'from' parameter to prevent open redirects
        const decodedFrom = decodeURIComponent(currentFrom);
        if (isValidInternalUrl(decodedFrom)) {
          return `${item.url}?from=${encodeURIComponent(currentFrom)}`;
        }
        // Fall back to safe default if URL validation fails
        return `${item.url}?from=/mail`;
      }

      // Handle category links
      if (category && item.url.includes('category=')) {
        return item.url;
      }

      return item.url;
    },
    [pathname, searchParams, isValidInternalUrl],
  );

  const isUrlActive = useCallback(
    (url: string) => {
      const urlObj = new URL(
        url,
        typeof window === 'undefined' ? BASE_URL : window.location.origin,
      );
      const cleanPath = pathname.replace(/\/$/, '');
      const cleanUrl = urlObj.pathname.replace(/\/$/, '');

      if (cleanPath !== cleanUrl) return false;

      const urlParams = new URLSearchParams(urlObj.search);
      const currentParams = new URLSearchParams(searchParams);

      for (const [key, value] of urlParams) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    },
    [pathname, searchParams],
  );

  return (
    <SidebarGroup className="space-y-2.5 py-0">
      <SidebarMenu>
        {items.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen={section.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <div className="space-y-1 pb-2">
                {section.items.map((item) => (
                  <NavItem
                    key={item.url}
                    {...item}
                    isActive={isUrlActive(item.url)}
                    href={getHref(item)}
                  />
                ))}
              </div>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavItem(item: NavItemProps & { href: string }) {
	const iconRef = useRef<IconRefType>(null);
	const { data: stats } = useStats();
	const { openFeaturebase } = useFeaturebase();
	const t = useTranslations();
	const [, clearBulkSelection] = useAtom(clearBulkSelectionAtom);

  if (item.disabled) {
    return (
      <SidebarMenuButton
        tooltip={t(item.title as MessageKey)}
        className="flex cursor-not-allowed items-center opacity-50"
      >
        {item.icon && <item.icon ref={iconRef} className="relative mr-2.5 h-3 w-3.5" />}
        <p className="mt-0.5 text-[13px]">{t(item.title as MessageKey)}</p>
      </SidebarMenuButton>
    );
  }

	// Handle Featurebase button click
	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		clearBulkSelection();

		if (item.isFeaturebaseButton) {
			e.preventDefault();
			openFeaturebase();
		}

    if (item.onClick) {
      item.onClick(e);
    }
  };

  // Apply animation handlers to all buttons including back buttons
  const linkProps = {
    href: item.href,
    onClick: handleClick,
    onMouseEnter: () => iconRef.current?.startAnimation?.(),
    onMouseLeave: () => iconRef.current?.stopAnimation?.(),
  };

  const buttonContent = (
    <SidebarMenuButton
      tooltip={t(item.title as MessageKey)}
      className={cn(
        'hover:bg-subtleWhite dark:hover:bg-subtleBlack flex items-center',
        item.isActive && 'bg-subtleWhite text-accent-foreground dark:bg-subtleBlack',
      )}
    >
      {item.icon && <item.icon ref={iconRef} className="mr-2" />}
      <p className="mt-0.5 text-[13px]">{t(item.title as MessageKey)}</p>
      {stats && stats.find((stat) => stat.label?.toLowerCase() === item.id?.toLowerCase()) && (
        <Badge className="ml-auto rounded-md" variant="outline">
          {stats

            .find((stat) => stat.label?.toLowerCase() === item.id?.toLowerCase())

            ?.count?.toLocaleString() || '0'}
        </Badge>
      )}
    </SidebarMenuButton>
  );

  if (item.isBackButton) {
    return <Link {...linkProps}>{buttonContent}</Link>;
  }

  return (
    <Collapsible defaultOpen={item.isActive}>
      <CollapsibleTrigger asChild>
        <Link {...linkProps}>{buttonContent}</Link>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
