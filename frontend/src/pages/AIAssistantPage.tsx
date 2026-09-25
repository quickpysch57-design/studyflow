import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Modal, Skeleton, ScrollArea } from '../components/ui';
import {
  SparklesIcon, ChatBubbleLeftRightIcon, LightBulbIcon,
  QuestionMarkCircleIcon, DocumentTextIcon, PlayCircleIcon,
  ArrowRightIcon, XMarkIcon, DocumentIcon, CheckCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';
import { format } from 'date-fns';

const MODES = [
  { id: 'EXPLAIN', label: 'Explain', icon: LightBulbIcon, desc: 'Understand concepts clearly' },
  { id: 'QUIZ', label: 'Quiz', icon: QuestionMarkCircleIcon, desc: 'Practice with questions' },
  { id: 'FLASHCARDS', label: 'Flashcards', icon: DocumentTextIcon, desc: 'Active recall cards' },
  { id: 'SUMMARY', label: 'Summary', icon: DocumentTextIcon, desc: 'Condensed key points' },
  { id: 'STUDY_PLAN', label: 'Study Plan', icon: PlayCircleIcon, desc: 'Personalized schedule' },
  { id: 'PRACTICE', label: 'Practice', icon: ChatBubbleLeftRightIcon, desc: 'Guided problem solving' }
];

interface Conversation {
  id: string;
  title: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

export function AIAssistantPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentMode, setCurrentMode] = useState('EXPLAIN');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newChatModal, setNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/ai/conversations');
      setConversations(res.data.conversations);
    } catch { console.error('Failed to fetch conversations'); }
    finally { setLoading(false); }
  };

  const createConversation = async () => {
    try {
      const res = await api.post('/api/ai/conversations', {
        title: 'New Chat',
        mode: currentMode
      });
      const newConv = res.data.conversation;
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      setNewChatModal(false);
    } catch { toast.error('Failed to create conversation'); }
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/api/ai/conversations/${id}`);
      setConversations(conversations.filter(c => c.id !== id));
      if (activeConversation?.id === id) setActiveConversation(null);
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;
    if (!activeConversation) {
      await createConversation();
      return;
    }

    const userMessage = inputMessage;
    setInputMessage('');
    setSending(true);

    try {
      const res = await api.post(`/api/ai/conversations/${activeConversation.id}/messages`, {
        content: userMessage
      });

      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { role: 'user', content: userMessage, createdAt: new Date().toISOString() }, res.data.message]
      } : null);
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [activeConversation?.messages]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">AI Study Assistant</h1>
          <p className="text-body-lg text-surface-400 mt-1">Your personalized study companion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button variant="primary" onClick={() => setNewChatModal(true)}>
            <SparklesIcon className="h-5 w-5" /> New Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} lg:w-80 flex-shrink-0 glass border-r border-surface-700/50 flex flex-col transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-surface-700/50">
            <h3 className="font-semibold text-surface-50 mb-3">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    currentMode === mode.id
                      ? 'bg-primary-500/20 border border-primary-500/30'
                      : 'bg-surface-800/50 border border-surface-700/50 hover:border-primary-500/20'
                  }`}
                >
                  <mode.icon className={`h-5 w-5 mb-1 ${currentMode === mode.id ? 'text-primary-400' : 'text-surface-500'}`} />
                  <p className="font-medium text-body-sm">{mode.label}</p>
                  <p className="text-body-xs text-surface-500">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="font-semibold text-surface-50 px-2 mb-2">Conversations</h3>
            {conversations.length === 0 ? (
              <p className="text-surface-500 text-body-sm text-center py-8">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  active={activeConversation?.id === conv.id}
                  onClick={() => selectConversation(conv)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <ChatView
              conversation={activeConversation}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sending={sending}
              onSend={sendMessage}
              onCopy={copyToClipboard}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            <WelcomeView currentMode={currentMode} onNewChat={() => setNewChatModal(true)} />
          )}
        </div>
      </div>

      <Modal isOpen={newChatModal} onClose={() => setNewChatModal(false)} title="New Conversation">
        <div className="space-y-4">
          <p className="text-surface-400">Choose a mode for your new conversation:</p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => { setCurrentMode(mode.id); createConversation(); }}
                className="p-4 rounded-xl border border-surface-700/50 bg-surface-800/50 hover:border-primary-500/30 text-left transition-all"
              >
                <mode.icon className="h-6 w-6 text-primary-400 mb-2" />
                <p className="font-medium text-surface-50">{mode.label}</p>
                <p className="text-body-xs text-surface-500">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ConversationItem({ conversation, active, onClick, onDelete }: { conversation: Conversation; active: boolean; onClick: () => void; onDelete: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between gap-2 ${
        active
          ? 'bg-primary-500/20 border border-primary-500/30'
          : 'bg-surface-800/50 border border-surface-700/50 hover:border-primary-500/20'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-50 truncate">{conversation.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="neutral" className="text-xs">{conversation.mode}</Badge>
          <span className="text-body-xs text-surface-500">{format(new Date(conversation.updatedAt), 'MMM d')}</span>
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800 opacity-0 group-hover:opacity-100">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </button>
  );
}

function WelcomeView({ currentMode, onNewChat }: { currentMode: string; onNewChat: () => void }) {
  const modeInfo = MODES.find(m => m.id === currentMode)!;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
        <SparklesIcon className="h-12 w-12 text-primary-400" />
      </div>
      <h2 className="text-heading-xl font-bold text-surface-50 mb-3">Welcome to your AI Study Assistant</h2>
      <p className="text-body-lg text-surface-400 mb-8 max-w-md">
        Ask questions, generate quizzes, create flashcards, summarize topics, or get personalized study plans.
      </p>

      <div className="w-full max-w-md space-y-3 mb-8">
        <button onClick={onNewChat} className="w-full p-4 rounded-xl bg-primary-500/20 border border-primary-500/30 text-left hover:bg-primary-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <modeInfo.icon className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-surface-50">Start {modeInfo.label} Session</p>
              <p className="text-body-xs text-surface-500">{modeInfo.desc}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="w-full max-w-md">
        <p className="text-body-sm text-surface-500 mb-3">Or try one of these:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Explain photosynthesis simply',
            'Quiz me on calculus derivatives',
            'Create flashcards for biology terms',
            'Summarize World War 2 causes',
            'Plan 2 weeks for physics exam',
            'Practice chemistry equations'
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => { setInputMessage(suggestion); onNewChat(); }}
              className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 text-left hover:border-primary-500/30 transition-all"
            >
              <span className="text-body-sm text-surface-300">"{suggestion}"</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatView({ conversation, inputMessage, setInputMessage, sending, onSend, onCopy, messagesEndRef }: any) {
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-surface-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-surface-50">{conversation.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{conversation.mode}</Badge>
              <span className="text-body-xs text-surface-500">{conversation.messages.length} messages</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveConversation(null)} className="lg:hidden">
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto p-4 space-y-6">
        {conversation.messages.map((message: any, index: number) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
            onCopy={onCopy}
            onEdit={setEditingMessage}
            editing={editingMessage?.id === message.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {editingMessage && (
        <div className="p-4 border-t border-surface-700/50 bg-surface-900/50">
          <textarea
            value={editingMessage.content}
            onChange={e => setEditingMessage({ ...editingMessage, content: e.target.value })}
            className="w-full p-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setEditingMessage(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { /* update message */ setEditingMessage(null); }}>Save</Button>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-surface-700/50">
        <div className="flex items-end gap-3">
          <textarea
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Ask me anything about your studies..."
            className="flex-1 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none min-h-[52px] max-h-48"
            rows={1}
            disabled={sending}
          />
          <Button variant="primary" onClick={onSend} disabled={!inputMessage.trim() || sending} className="h-12">
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <ArrowRightIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-body-xs text-surface-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, index, onCopy, onEdit, editing }: any) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="h-4 w-4 text-primary-400" />
        </div>
      )}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl ${isUser ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-surface-800/50 border border-surface-700/50'}`}>
          <div className="prose prose-invert dark max-w-none whitespace-pre-wrap">
            {message.content}
          </div>
          {message.metadata && message.metadata.type === 'quiz' && (
            <QuizRenderer quiz={message.metadata.data} />
          )}
          {message.metadata && message.metadata.type === 'flashcards' && (
            <FlashcardRenderer cards={message.metadata.data} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <button onClick={() => onCopy(message.content)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" title="Copy">
            <DocumentIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit({ id: message.id, content: message.content })} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" title="Edit">
            <PencilIcon className="h-4 w-4" />
          </button>
          <span className="text-body-xs text-surface-500">{format(new Date(message.createdAt), 'h:mm a')}</span>
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-surface-700 flex items-center justify-center flex-shrink-0">
          <span className="text-body-xs font-medium text-surface-400">You</span>
        </div>
      )}
    </div>
  );
}

function QuizRenderer({ quiz }: { quiz: any[] }) {
  return (
    <div className="mt-4 space-y-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
      <h4 className="font-medium text-surface-50 mb-3">Practice Quiz</h4>
      {quiz.map((q: any, i: number) => (
        <div key={i} className="space-y-2 p-3 rounded-lg bg-surface-900/50">
          <p className="font-medium text-surface-50">{i + 1}. {q.question}</p>
          {q.options && q.options.map((opt: string, j: number) => (
            <label key={j} className="flex items-center gap-2 p-2 rounded-lg bg-surface-800 hover:bg-surface-700 cursor-pointer">
              <input type="radio" name={`q-${i}`} className="w-4 h-4 text-primary-500 border-surface-600 focus:ring-primary-500" />
              <span className="text-body-sm text-surface-300">{opt}</span>
            </label>
          ))}
          {q.explanation && (
            <details className="mt-2">
              <summary className="text-body-sm text-surface-500 cursor-pointer">Show Explanation</summary>
              <p className="text-body-sm text-surface-400 mt-1">{q.explanation}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function FlashcardRenderer({ cards }: { cards: any[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  return (
    <div className="mt-4 space-y-4">
      {cards.map((card: any, i: number) => (
        <div key={i} className="perspective-1000">
          <button
            onClick={() => setFlipped(prev => ({ ...prev, [i]: !prev[i] }))}
            className="w-full aspect-[4/3] relative cursor-pointer"
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-3d ${flipped[i] ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-surface-800/50 border border-surface-700/50 p-6 flex items-center justify-center">
                <p className="text-surface-50 text-center">{card.front}</p>
              </div>
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl bg-primary-500/10 border border-primary-500/30 p-6 flex items-center justify-center">
                <p className="text-surface-50 text-center">{card.back}</p>
              </div>
            </div>
          </button>
          <p className="text-body-xs text-surface-500 text-center mt-2">Click to flip</p>
        </div>
      ))}
    </div>
  );
}