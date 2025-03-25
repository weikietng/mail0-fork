import { Sparkles, X, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIEmailContent } from '@/actions/ai';
import { useState, useEffect, useRef } from 'react';
import { generateConversationId } from '@/lib/ai';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { type JSONContent } from 'novel';
import { toast } from 'sonner';

// Types
interface AIAssistantProps {
  currentContent?: string;
  recipients?: string[];
  subject?: string;
  userContext?: {
    name?: string;
    email?: string;
  };
  onContentGenerated?: (content: JSONContent, subject?: string) => void;
}

type MessageType = 'email' | 'question' | 'system';
type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: number;
}

// Utility functions
const extractSubjectFromContent = (content: string): string | null => {
  const patterns = [
    /subject:\s*([^\n]+)/i,
    /^RE:\s*([^\n]+)/i,
    /^(Dear|Hello|Hi|Greetings).*?\n\n(.{5,60})[.?!]/i,
    /\b(regarding|about|concerning|reference to|in response to)\b[^.!?]*[.!?]/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (pattern.toString().includes('Dear|Hello|Hi|Greetings')) {
        return match[2]?.trim() || null;
      } else {
        return match[1]?.trim() || null;
      }
    }
  }

  const firstSentence = content.match(/^[^.!?]{5,60}[.!?]/);
  return firstSentence ? firstSentence[0].trim() : null;
};

// Animation variants
const animations = {
  container: {
    initial: { width: 32, opacity: 0 },
    animate: (width: number) => ({
      width: width < 640 ? '200px' : '400px',
      opacity: 1,
      transition: {
        width: { type: 'spring', stiffness: 250, damping: 35 },
        opacity: { duration: 0.4 },
      },
    }),
    exit: {
      width: 32,
      opacity: 0,
      transition: {
        width: { type: 'spring', stiffness: 250, damping: 35 },
        opacity: { duration: 0.4 },
      },
    },
  },
  content: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.15, duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
  input: {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.4 } },
    exit: { y: 10, opacity: 0, transition: { duration: 0.3 } },
  },
  button: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  },
  card: {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { opacity: 1, y: -10, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } },
  },
};

// LoadingSpinner component
const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    className="mr-1 h-5 w-5 text-black dark:text-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  </motion.div>
);

// ContentPreview component
const ContentPreview = ({ content, animations }: { content: string; animations: any }) => (
  <motion.div
    variants={animations.card}
    initial="initial"
    animate="animate"
    exit="exit"
    className="absolute bottom-full left-0 z-30 w-[400px] overflow-hidden rounded-xl border bg-white shadow-md dark:bg-black"
  >
    <div className="p-3">
      <div className="max-h-60 min-h-[150px] overflow-y-auto rounded-md p-1 text-sm">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  </motion.div>
);

// ActionButtons component
const ActionButtons = ({
  isLoading,
  onClose,
  onRefresh,
  onSubmit,
  onAccept,
  hasContent,
  hasPrompt,
  animations,
}: {
  isLoading: boolean;
  onClose: (e: React.MouseEvent) => void;
  onRefresh: () => void;
  onSubmit: (e?: React.MouseEvent) => Promise<void>;
  onAccept: () => void;
  hasContent: boolean;
  hasPrompt: boolean;
  animations: any;
}) => (
  <motion.div variants={animations.button} className="ml-1 flex items-center gap-1 pr-1">
    {isLoading ? (
      <LoadingSpinner />
    ) : (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 rounded-full bg-transparent p-0 text-black hover:bg-transparent dark:text-white"
        >
          <X className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          className="h-6 w-6 rounded-full bg-transparent p-0 text-black hover:bg-transparent dark:text-white"
          title="Regenerate response"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        {hasContent ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAccept}
            className="h-6 w-6 rounded-full bg-transparent p-0 text-black hover:bg-transparent dark:text-white"
            title="Apply AI content"
          >
            <Check className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onSubmit}
            className="h-6 w-6 rounded-full bg-transparent p-0 text-black hover:bg-transparent dark:text-white"
            disabled={!hasPrompt || isLoading}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </>
    )}
  </motion.div>
);

// Main component
export const AIAssistant = ({
  currentContent = '',
  recipients = [],
  subject = '',
  userContext,
  onContentGenerated,
}: AIAssistantProps) => {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    content: string;
    jsonContent: JSONContent;
  } | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [suggestedSubject, setSuggestedSubject] = useState<string>('');

  // Generate conversation ID immediately without useEffect
  const conversationId = generateConversationId();

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  // User context using activeConnection from session
  const activeConnection = session?.activeConnection;
  const userName = userContext?.name || activeConnection?.name || session?.user.name || '';
  const userEmail = userContext?.email || activeConnection?.email || session?.user.email || '';

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  // Add a message to the conversation
  const addMessage = (role: MessageRole, content: string, type: MessageType) => {
    setMessages((prev) => [...prev, { role, content, type, timestamp: Date.now() }]);
  };

  // Reset states
  const resetStates = (includeExpanded = true) => {
    setPrompt('');
    setGeneratedContent(null);
    setShowActions(false);
    setIsAskingQuestion(false);
    if (includeExpanded) setIsExpanded(false);
    setSuggestedSubject('');
  };

  // Handle chat with AI button
  const handleChatWithAI = () => {
    setIsExpanded(!isExpanded);

    if (!isExpanded && messages.length === 0) {
      addMessage(
        'system',
        'Try asking me to write an email for you. For example:\n• Write a professional email to John about the project update\n• Draft a thank you email to Sarah for her help\n• Create a meeting invitation for the team',
        'system',
      );
    }
  };

  // Handle submit
  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);

      // Add user message
      addMessage('user', prompt, 'question');

      // Reset states
      setIsAskingQuestion(false);
      setShowActions(false);

      // Call the server action
      const result = await generateAIEmailContent({
        prompt,
        currentContent: generatedContent?.content || currentContent,
        to: recipients,
        conversationId,
        userContext: { name: userName, email: userEmail },
      });

      // Handle response based on type
      if (result.type === 'question') {
        setIsAskingQuestion(true);
        addMessage('assistant', result.content, 'question');
      } else if (result.type === 'email') {
        setGeneratedContent({
          content: result.content,
          jsonContent: result.jsonContent,
        });

        if (!subject || subject.trim() === '') {
          const extractedSubject = extractSubjectFromContent(result.content);
          if (extractedSubject) setSuggestedSubject(extractedSubject);
        }

        addMessage('assistant', result.content, 'email');
        setShowActions(true);
      } else {
        addMessage('system', result.content, 'system');
      }

      setPrompt('');
    } catch (error) {
      console.error('AI Assistant Error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate email content. Please try again.';
      toast.error(errorMessage);
      addMessage('system', errorMessage, 'system');
    } finally {
      setIsLoading(false);
      setIsExpanded(true);
    }
  };

  // Handle accept
  const handleAccept = () => {
    if (generatedContent && onContentGenerated) {
      // Extract the actual content from the JSON structure
      const actualContent = generatedContent.content;

      // First update subject if available
      if (suggestedSubject) {
        // Pass both the JSON content for the editor and the plaintext content for validation
        onContentGenerated(generatedContent.jsonContent, suggestedSubject);
      } else {
        onContentGenerated(generatedContent.jsonContent);
      }

      // Add confirmation message
      addMessage('system', 'Email content applied successfully.', 'system');
      resetStates();
      toast.success('AI content applied to your email');
    }
  };

  // Handle reject
  const handleReject = () => {
    addMessage('system', 'Email content rejected.', 'system');
    resetStates();
    toast.info('AI content rejected');
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (prompt.trim()) {
      await handleSubmit();
    } else if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((item) => item.role === 'user');
      if (lastUserMessage) {
        setPrompt(lastUserMessage.content);
        setTimeout(() => handleSubmit(), 0);
      }
    }
  };

  // Handle close
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetStates();
  };

  // Handle keydown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      resetStates();
    }
  };

  return (
    <div className="flex justify-start">
      <div
        className="relative inline-block"
        style={{
          width: isExpanded ? (isMobile ? '200px' : '400px') : '32px', // Responsive width
          height: '32px',
          minHeight: '32px',
          maxWidth: '100vw', // Prevent extending beyond viewport
          overflow: 'visible', // Allow content to overflow
        }}
      >
        {/* Floating card for generated content */}
        <AnimatePresence>
          {showActions && generatedContent && (
            <ContentPreview content={generatedContent.content} animations={animations} />
          )}
        </AnimatePresence>

        {/* Fixed position Sparkles icon */}
        <div className="pointer-events-none absolute left-0.5 top-0.5 z-20 flex h-8 w-8 items-center justify-center">
          <Sparkles className="h-4 w-4 text-black dark:text-white" />
        </div>

        {/* Button */}
        <button
          onClick={handleChatWithAI}
          className="hover:bg-accent absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm transition-colors dark:bg-black"
          title="Ask AI Assistant"
        />

        {/* Expanded state */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              variants={animations.container}
              custom={isMobile ? 400 : 800}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center overflow-hidden rounded-full border bg-white shadow-sm dark:bg-black"
              onClick={(e) => e.stopPropagation()}
              style={{ transformOrigin: 'left center' }}
            >
              {/* Empty space for the fixed icon */}
              <div className="h-8 w-8 flex-shrink-0"></div>

              {/* Expanding content */}
              <motion.div variants={animations.content} className="flex-grow overflow-hidden">
                <motion.div variants={animations.input}>
                  <Input
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask AI to write an email..."
                    className="h-8 flex-grow border-0 bg-white px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-black"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              {/* Action buttons */}
              <ActionButtons
                isLoading={isLoading}
                onClose={handleClose}
                onRefresh={handleRefresh}
                onSubmit={handleSubmit}
                onAccept={handleAccept}
                hasContent={!!generatedContent}
                hasPrompt={!!prompt.trim()}
                animations={animations}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
