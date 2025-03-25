'use client';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SidebarToggle } from '@/components/ui/sidebar-toggle';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Suspense } from 'react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SettingsLayoutSkeleton />}>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  );
}

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <>
      <AppSidebar className="hidden lg:flex" />
      <div className="w-full bg-white md:py-3 md:pr-2 dark:bg-black">
        <div className="rounded-inherit flex">
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="settings-panel-layout"
            className="rounded-inherit gap-1.5 overflow-hidden"
          >
            <ResizablePanel
              className="border-none !bg-transparent"
              defaultSize={isMobile ? 100 : 35}
              minSize={isMobile ? 100 : 35}
            >
              <div className="md:shadow-s bg-offsetLight dark:bg-offsetDark flex-1 flex-col overflow-y-auto shadow-inner md:flex md:rounded-2xl md:border">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-1.5 border-b p-2">
                  <SidebarToggle className="h-fit px-2" />
                </div>
                <ScrollArea className="h-[calc(100dvh-56px)] p-2 pt-0 md:h-[calc(100dvh-(8px+8px+14px+44px))]">
                  <div className="p-2 md:p-3 md:pt-5">{children}</div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
}

function SettingsLayoutSkeleton() {
  return (
    <>
      <div className="hidden lg:flex lg:w-80" />
      <div className="bg-sidebar w-full md:p-3">
        <div className="bg-muted h-[calc(100svh-1.5rem)] animate-pulse md:rounded-2xl" />
      </div>
    </>
  );
}
