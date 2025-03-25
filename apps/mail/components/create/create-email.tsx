'use client';
import { generateHTML, generateJSON } from '@tiptap/core';
import { useConnections } from '@/hooks/use-connections';
import { createDraft, getDraft } from '@/actions/drafts';
import { ArrowUpIcon, Paperclip, X } from 'lucide-react';
import { SidebarToggle } from '../ui/sidebar-toggle';
import Paragraph from '@tiptap/extension-paragraph';
import Document from '@tiptap/extension-document';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { AIAssistant } from './ai-assistant';
import { useTranslations } from 'next-intl';
import { sendEmail } from '@/actions/send';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import { type JSONContent } from 'novel';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';
import * as React from 'react';
import Editor from './editor';
import './prosemirror.css';

const MAX_VISIBLE_ATTACHMENTS = 12;

export function CreateEmail() {
  const [toInput, setToInput] = React.useState('');
  const [toEmails, setToEmails] = React.useState<string[]>([]);
  const [subjectInput, setSubjectInput] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [resetEditorKey, setResetEditorKey] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [messageContent, setMessageContent] = React.useState('');
  const [draftId, setDraftId] = useQueryState('draftId');
  const [defaultValue, setDefaultValue] = React.useState<JSONContent | null>(null);
  const [editorReady, setEditorReady] = React.useState(false);

  const { data: session } = useSession();
  const { data: connections } = useConnections();

  const activeAccount = React.useMemo(() => {
    if (!session) return null;
    return connections?.find((connection) => connection.id === session?.activeConnection?.id);
  }, [session, connections]);

  const userName =
    activeAccount?.name || session?.activeConnection?.name || session?.user.name || '';
  const userEmail =
    activeAccount?.email || session?.activeConnection?.email || session?.user.email || '';

  React.useEffect(() => {
    if (!draftId && !defaultValue) {
      // Set initial empty content
      setDefaultValue({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      });
      setEditorReady(true);
    }
  }, [draftId, defaultValue]);

  React.useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) {
        setDefaultValue({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        });
        return;
      }

      try {
        const draft = await getDraft(draftId);

        if (!draft) {
          toast.error('Draft not found');
          return;
        }

        setDraftId(draft.id);

        if (draft.to?.length) {
          setToEmails(draft.to);
        }
        if (draft.subject) {
          setSubjectInput(draft.subject);
        }

        if (draft.content) {
          try {
            const json = generateJSON(draft.content, [Document, Paragraph, Text, Bold]);
            setDefaultValue(json);
            setMessageContent(draft.content);
          } catch (error) {
            console.error('Error parsing draft content:', error);
          }
        }

        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading draft:', error);
        toast.error('Failed to load draft');
      }
    };

    loadDraft();
  }, [draftId]);

  const t = useTranslations();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = (email: string) => {
    const trimmedEmail = email.trim().replace(/,$/, '');

    if (!trimmedEmail) return;

    if (toEmails.includes(trimmedEmail)) {
      setToInput('');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error(`Invalid email format: ${trimmedEmail}`);
      return;
    }

    setToEmails([...toEmails, trimmedEmail]);
    setToInput('');
    setHasUnsavedChanges(true);
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
      setHasUnsavedChanges(true);
    }
  };

  const saveDraft = React.useCallback(async () => {
    if (!hasUnsavedChanges) return;
    if (!toEmails.length && !subjectInput && !messageContent) return;

    try {
      setIsSaving(true);
      const draftData = {
        to: toEmails.join(', '),
        subject: subjectInput,
        message: messageContent || '',
        attachments: attachments,
        id: draftId,
      };

      const response = await createDraft(draftData);

      if (response?.id && response.id !== draftId) {
        setDraftId(response.id);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [toEmails, subjectInput, messageContent, attachments, draftId, hasUnsavedChanges]);

  React.useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      saveDraft();
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, saveDraft]);

  React.useEffect(() => {
    setHasUnsavedChanges(true);
  }, [messageContent]);

  const handleSendEmail = async () => {
    if (!toEmails.length) {
      toast.error('Please enter at least one recipient email address');
      return;
    }

    if (!messageContent.trim() || messageContent === JSON.stringify(defaultValue)) {
      toast.error('Please enter a message');
      return;
    }

    if (!subjectInput.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    try {
      await sendEmail({
        to: toEmails.join(','),
        subject: subjectInput,
        message: messageContent,
        attachments: attachments,
      });

      toast.success(t('pages.createEmail.emailSentSuccessfully'));

      setToInput('');
      setToEmails([]);
      setSubjectInput('');
      setAttachments([]);
      setMessageContent('');

      setDefaultValue({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      });

      setResetEditorKey((prev) => prev + 1);

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(t('pages.createEmail.failedToSendEmail'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      setHasUnsavedChanges(true);
    }
  };

  // Add ref for to input
  const toInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if "/" is pressed and no input/textarea is focused
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        toInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div
      className="bg-offsetLight dark:bg-offsetDark relative flex h-full flex-col overflow-hidden shadow-inner md:rounded-2xl md:border md:shadow-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="bg-background/80 border-primary/30 absolute inset-0 z-50 m-4 flex items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-sm">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <Paperclip className="text-muted-foreground h-12 w-12" />
            <p className="text-lg font-medium">{t('pages.createEmail.dropFilesToAttach')}</p>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-1.5 p-2 transition-colors">
        <SidebarToggle className="h-fit px-2" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pt-4 md:px-2">
            <div className="space-y-3 md:px-1">
              <div className="flex items-center">
                <div className="text-muted-foreground w-20 flex-shrink-0 pr-3 text-right text-[1rem] font-[600] opacity-50 md:w-24">
                  {t('common.mailDisplay.to')}
                </div>
                <div className="group relative left-[2px] flex w-full flex-wrap items-center rounded-md border border-none bg-transparent p-1 transition-all focus-within:border-none focus:outline-none">
                  {toEmails.map((email, index) => (
                    <div
                      key={index}
                      className="bg-accent flex items-center gap-1 rounded-md border px-2 text-sm font-medium"
                    >
                      <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {email}
                      </span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground ml-1 rounded-full"
                        onClick={() => {
                          setToEmails((emails) => emails.filter((_, i) => i !== index));
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="email"
                    className="text-md relative left-[3px] min-w-[120px] flex-1 bg-transparent placeholder:text-[#616161] placeholder:opacity-50 focus:outline-none"
                    placeholder={toEmails.length ? '' : t('pages.createEmail.example')}
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === ',' || e.key === 'Enter' || e.key === ' ') && toInput.trim()) {
                        e.preventDefault();
                        handleAddEmail(toInput);
                      } else if (e.key === 'Backspace' && !toInput && toEmails.length > 0) {
                        setToEmails((emails) => emails.slice(0, -1));
                        setHasUnsavedChanges(true);
                      }
                    }}
                    onBlur={() => {
                      if (toInput.trim()) {
                        handleAddEmail(toInput);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="text-muted-foreground w-20 flex-shrink-0 pr-3 text-right text-[1rem] font-[600] opacity-50 md:w-24">
                  {t('common.searchBar.subject')}
                </div>
                <input
                  type="text"
                  className="text-md relative left-[7.5px] w-full bg-transparent placeholder:text-[#616161] placeholder:opacity-50 focus:outline-none"
                  placeholder={t('common.searchBar.subject')}
                  value={subjectInput}
                  onChange={(e) => {
                    setSubjectInput(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex">
                <div className="text-muted-foreground text-md relative -top-[1px] w-20 flex-shrink-0 pr-3 pt-2 text-right font-[600] opacity-50 md:w-24">
                  {t('pages.createEmail.body')}
                </div>
                <div className="w-full">
                  {defaultValue && (
                    <Editor
                      initialValue={defaultValue}
                      onChange={(newContent) => {
                        setMessageContent(newContent);
                        if (newContent.trim() !== '') {
                          setHasUnsavedChanges(true);
                        }
                      }}
                      key={resetEditorKey}
                      placeholder={t('pages.createEmail.writeYourMessageHere')}
                      onAttachmentsChange={setAttachments}
                      onCommandEnter={handleSendEmail}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-offsetLight dark:bg-offsetDark sticky bottom-0 left-0 right-0 flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="mr-1 pb-2 pt-2">
              <AIAssistant
                currentContent={messageContent}
                subject={subjectInput}
                recipients={toEmails}
                userContext={{ name: userName, email: userEmail }}
                onContentGenerated={(jsonContent, newSubject) => {
                  console.log('CreateEmail: Received AI-generated content', {
                    jsonContentType: jsonContent.type,
                    hasContent: Boolean(jsonContent.content),
                    contentLength: jsonContent.content?.length || 0,
                    newSubject: newSubject,
                  });

                  try {
                    // Update the editor content with the AI-generated content
                    setDefaultValue(jsonContent);

                    // Extract and set the text content for validation purposes
                    // This ensures the submit button is enabled immediately
                    if (jsonContent.content && jsonContent.content.length > 0) {
                      // Extract text content from JSON structure recursively
                      const extractTextContent = (node: any): string => {
                        if (!node) return '';

                        if (node.text) return node.text;

                        if (node.content && Array.isArray(node.content)) {
                          return node.content.map(extractTextContent).join(' ');
                        }

                        return '';
                      };

                      // Process all content nodes
                      const textContent = jsonContent.content
                        .map(extractTextContent)
                        .join('\n')
                        .trim();
                      setMessageContent(textContent);
                    }

                    // Update the subject if provided
                    if (newSubject && (!subjectInput || subjectInput.trim() === '')) {
                      console.log('CreateEmail: Setting new subject from AI', newSubject);
                      setSubjectInput(newSubject);
                    }

                    // Mark as having unsaved changes
                    setHasUnsavedChanges(true);

                    // Reset the editor to ensure it picks up the new content
                    setResetEditorKey((prev) => prev + 1);

                    console.log('CreateEmail: Successfully applied AI content');
                  } catch (error) {
                    console.error('CreateEmail: Error applying AI content', error);
                    toast.error('Error applying AI content to your email. Please try again.');
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="default"
              className="h-9 w-9 overflow-hidden rounded-full"
              onClick={handleSendEmail}
              disabled={!toEmails.length || !messageContent.trim() || !subjectInput.trim()}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
