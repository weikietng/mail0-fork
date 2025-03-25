'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SettingsCard } from '@/components/settings/settings-card';
import { AddConnectionDialog } from '@/components/connection/add';
import { useConnections } from '@/hooks/use-connections';
import { deleteConnection } from '@/actions/connections';
import { Skeleton } from '@/components/ui/skeleton';
import { emailProviders } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Trash, Plus } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ConnectionsPage() {
  const { refetch } = useSession();
  const { data: connections, mutate, isLoading } = useConnections();
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const t = useTranslations();

  const disconnectAccount = async (connectionId: string) => {
    try {
      await deleteConnection(connectionId);
      toast.success(t('pages.settings.connections.disconnectSuccess'));
      mutate();
      refetch();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error(t('pages.settings.connections.disconnectError'));
    }
  };

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t('pages.settings.connections.title')}
        description={t('pages.settings.connections.description')}
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-popover flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-full lg:w-32" />
                      <Skeleton className="h-3 w-full lg:w-48" />
                    </div>
                  </div>
                  <Skeleton className="ml-4 h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          ) : connections?.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-popover flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {connection.picture ? (
                      <Image
                        src={connection.picture}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                        <svg viewBox="0 0 24 24" className="text-primary h-6 w-6">
                          <path fill="currentColor" d={emailProviders[0]!.icon} />
                        </svg>
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{connection.name}</span>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Tooltip
                          delayDuration={0}
                          open={openTooltip === connection.id}
                          onOpenChange={(open) => {
                            if (window.innerWidth <= 768) {
                              setOpenTooltip(open ? connection.id : null);
                            }
                          }}
                        >
                          <TooltipTrigger asChild>
                            <span
                              className="max-w-[180px] cursor-default truncate sm:max-w-[240px] md:max-w-[300px]"
                              onClick={() => {
                                if (window.innerWidth <= 768) {
                                  setOpenTooltip(
                                    openTooltip === connection.id ? null : connection.id,
                                  );
                                }
                              }}
                            >
                              {connection.email}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="select-all">
                            <div className="font-mono">{connection.email}</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary ml-4 shrink-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('pages.settings.connections.disconnectTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('pages.settings.connections.disconnectDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-4">
                        <DialogClose asChild>
                          <Button variant="outline">
                            {t('pages.settings.connections.cancel')}
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button onClick={() => disconnectAccount(connection.id)}>
                            {t('pages.settings.connections.remove')}
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-start">
            <AddConnectionDialog>
              <Button
                variant="outline"
                className="group relative w-9 overflow-hidden transition-all duration-200 hover:w-full sm:hover:w-[32.5%]"
              >
                <Plus className="absolute left-2 h-4 w-4" />
                <span className="whitespace-nowrap pl-7 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {t('pages.settings.connections.addEmail')}
                </span>
              </Button>
            </AddConnectionDialog>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
