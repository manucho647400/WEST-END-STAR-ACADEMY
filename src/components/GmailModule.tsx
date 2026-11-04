import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  getGoogleAccessToken, 
  signInWithGoogleWorkspace, 
  signOutGoogleWorkspace, 
  initGoogleAuth 
} from '../services/googleAuthService';
import { 
  getGmailProfile, 
  listGmailMessages, 
  getGmailMessage, 
  sendGmailEmail, 
  createGmailDraft, 
  deleteGmailMessage,
  generateFeeNoticeEmail,
  generateCbcProgressEmail,
  GmailProfile, 
  GmailMessageItem, 
  SendEmailPayload 
} from '../services/gmailService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WorkspaceConfirmDialog } from './WorkspaceConfirmDialog';
import { SchoolEmblem } from './SchoolEmblem';
import { CBC_GRADES } from '../data/initialData';
import { Student } from '../types';
import { 
  Mail, 
  Send, 
  Inbox, 
  RefreshCw, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  User, 
  LogOut, 
  Paperclip, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Calendar,
  DollarSign,
  GraduationCap
} from 'lucide-react';

export const GmailModule: React.FC = () => {
  const { students, academy, reportCards } = useSchool();
  const { currentUser } = useAuth();

  const [accessToken, setAccessToken] = useState<string | null>(() => getGoogleAccessToken());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'quick-dispatch'>('inbox');

  // Messages list state
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Quick dispatch state
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [dispatchType, setDispatchType] = useState<'fee' | 'cbc'>('fee');
  const [previewPayload, setPreviewPayload] = useState<SendEmailPayload | null>(null);

  // Feedback & Confirm Dialog
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    type: 'primary' | 'danger' | 'warning';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    action: async () => {},
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setAccessToken(token);
        fetchGmailProfileAndMessages(token);
      },
      () => {
        setAccessToken(null);
        setProfile(null);
        setMessages([]);
      }
    );

    if (accessToken) {
      fetchGmailProfileAndMessages(accessToken);
    }

    return () => unsubscribe();
  }, []);

  const fetchGmailProfileAndMessages = async (token: string) => {
    setIsLoadingMessages(true);
    try {
      const [prof, msgRes] = await Promise.all([
        getGmailProfile(token),
        listGmailMessages({ maxResults: 15, token }),
      ]);
      setProfile(prof);
      setMessages(msgRes.messages);
    } catch (err: any) {
      console.error('Gmail load error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load Gmail messages.' });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const { accessToken: token } = await signInWithGoogleWorkspace();
      setAccessToken(token);
      await fetchGmailProfileAndMessages(token);
      setFeedback({ type: 'success', message: 'Successfully connected to Google Workspace & Gmail!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to authenticate with Google.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleWorkspace();
    setAccessToken(null);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setFeedback({ type: 'success', message: 'Signed out from Google Workspace.' });
  };

  const handleRefresh = () => {
    if (accessToken) {
      fetchGmailProfileAndMessages(accessToken);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const res = await listGmailMessages({ q: searchQuery, maxResults: 15, token: accessToken });
      setMessages(res.messages);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to search messages.' });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleViewMessage = async (msg: GmailMessageItem) => {
    if (!accessToken) return;
    setIsLoadingDetail(true);
    try {
      const full = await getGmailMessage(msg.id, accessToken, 'FULL');
      setSelectedMessage(full);
    } catch (err: any) {
      setSelectedMessage(msg);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Trigger Send Custom Email
  const triggerSendEmail = () => {
    if (!composeTo.trim()) {
      setFeedback({ type: 'error', message: 'Please specify at least one recipient email address.' });
      return;
    }
    if (!composeSubject.trim()) {
      setFeedback({ type: 'error', message: 'Please provide an email subject.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Send Official Email via Gmail',
      message: `You are about to send an email to ${composeTo}. Confirm to proceed?`,
      itemName: `Subject: ${composeSubject}`,
      type: 'primary',
      action: async () => {
        setIsSending(true);
        try {
          await sendGmailEmail({
            to: composeTo.trim(),
            subject: composeSubject.trim(),
            body: composeBody.trim().replace(/\n/g, '<br/>'),
            cc: composeCc.trim() || undefined,
            isHtml: true,
          }, accessToken || undefined);

          setFeedback({ type: 'success', message: `Email dispatched successfully to ${composeTo}!` });
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setComposeCc('');
          setActiveTab('inbox');
          if (accessToken) fetchGmailProfileAndMessages(accessToken);
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to send email.' });
        } finally {
          setIsSending(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Trigger Save Draft
  const handleSaveDraft = async () => {
    if (!composeTo.trim() && !composeSubject.trim()) {
      setFeedback({ type: 'error', message: 'Specify a recipient or subject before saving draft.' });
      return;
    }
    try {
      await createGmailDraft({
        to: composeTo.trim(),
        subject: composeSubject.trim() || '(No Subject)',
        body: composeBody.trim().replace(/\n/g, '<br/>'),
        cc: composeCc.trim() || undefined,
        isHtml: true,
      }, accessToken || undefined);
      setFeedback({ type: 'success', message: 'Email saved to Gmail drafts successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save draft.' });
    }
  };

  // Trigger Delete Email
  const triggerDeleteMessage = (msg: GmailMessageItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Message from Gmail',
      message: 'Are you sure you want to permanently delete this message from your mailbox?',
      itemName: msg.subject || msg.id,
      type: 'danger',
      action: async () => {
        try {
          await deleteGmailMessage(msg.id, accessToken || undefined);
          setMessages(prev => prev.filter(m => m.id !== msg.id));
          if (selectedMessage?.id === msg.id) setSelectedMessage(null);
          setFeedback({ type: 'success', message: 'Message deleted successfully.' });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete message.' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Generate Quick Dispatch Email Preview
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) {
      setPreviewPayload(null);
      return;
    }

    const parentEmail = student.guardianEmail || `${student.regNo.toLowerCase()}@parents.westendstar.ac.ke`;

    if (dispatchType === 'fee') {
      const payload = generateFeeNoticeEmail({
        studentName: student.fullName,
        regNo: student.regNo,
        grade: student.grade,
        term: 'TERM 1',
        year: 2026,
        balanceAmount: student.feeBalance || 15000,
        dueDate: '15th March 2026',
        parentEmail,
        parentName: student.guardianName,
        paybill: '247247',
        accountNumber: `WESA-${student.regNo}`,
      });
      setPreviewPayload(payload);
    } else {
      const report = reportCards[student.id];
      const payload = generateCbcProgressEmail({
        studentName: student.fullName,
        regNo: student.regNo,
        grade: student.grade,
        term: 'TERM 1',
        rubricLevel: report?.overallPerformanceLevel || 'Meeting Expectations (ME)',
        overallScore: report?.totalScore || 342,
        rank: report?.classRank || 4,
        totalStudents: students.filter(s => s.grade === student.grade).length || 28,
        teacherRemarks: report?.facilitatorRemark || 'Displays outstanding competency in mathematical inquiry and active classroom engagement.',
        parentEmail,
      });
      setPreviewPayload(payload);
    }
  };

  // Re-generate preview when dispatch type changes
  useEffect(() => {
    if (selectedStudentId) {
      handleStudentSelect(selectedStudentId);
    }
  }, [dispatchType]);

  const triggerDispatchQuickEmail = () => {
    if (!previewPayload) return;
    const student = students.find(s => s.id === selectedStudentId);

    setConfirmDialog({
      isOpen: true,
      title: dispatchType === 'fee' ? 'Dispatch Official Fee Notice' : 'Dispatch CBC Performance Brief',
      message: `Send official notification to ${previewPayload.to} for learner ${student?.fullName || ''}?`,
      itemName: previewPayload.subject,
      type: 'primary',
      action: async () => {
        setIsSending(true);
        try {
          await sendGmailEmail(previewPayload, accessToken || undefined);
          setFeedback({ 
            type: 'success', 
            message: `Official notification successfully sent to ${previewPayload.to}!` 
          });
          if (accessToken) fetchGmailProfileAndMessages(accessToken);
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to dispatch email.' });
        } finally {
          setIsSending(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredStudents = students.filter(s => {
    if (selectedGrade !== 'All' && s.grade !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
                Gmail Official Communications
              </h2>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                Google Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated parent fee statements, CBC learner assessment briefs, and official institutional correspondence.
            </p>
          </div>
        </div>

        {/* Connection status and actions */}
        <div className="flex items-center gap-3">
          {accessToken ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left text-xs">
                <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                  {profile?.emailAddress || 'Connected to Gmail'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {profile ? `${profile.messagesTotal.toLocaleString()} messages` : 'OAuth Active'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                title="Refresh Messages"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSignOut}
                title="Disconnect Google"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              text="Connect Gmail"
            />
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* If Not Authenticated */}
      {!accessToken ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Connect West End Star Academy Gmail</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Authenticate with your Google Workspace account to read official incoming inquiries, draft custom messages, and instantly dispatch certified Fee Notices and CBC progress evaluations to parents.
            </p>
          </div>
          <div className="pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              text="Sign in with Google to Access Gmail"
              className="mx-auto"
            />
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% In-Memory Tokens
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Direct Gmail REST API
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Pre-flight User Confirmations
            </span>
          </div>
        </div>
      ) : (
        /* Authenticated Module Content */
        <div className="space-y-6">
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 gap-2 shadow-xs">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox & Messages</span>
              {messages.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'inbox' ? 'bg-emerald-950 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {messages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quick-dispatch')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'quick-dispatch'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Dispatch to Parents</span>
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'compose'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Compose Custom Email</span>
            </button>
          </div>

          {/* TAB 1: INBOX & MESSAGES */}
          {activeTab === 'inbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Messages List */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col space-y-3 min-h-[500px]">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sender, subject, keywords..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                  />
                </form>

                <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Recent Messages</span>
                  <span>{messages.length} loaded</span>
                </div>

                {isLoadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-700 mb-2" />
                    <span className="text-xs">Fetching Gmail inbox...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                    <Inbox className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-600">No messages found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try another search term or click Refresh</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleViewMessage(msg)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedMessage?.id === msg.id
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {msg.from || 'Unknown Sender'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 mt-1 truncate">
                          {msg.subject || '(No Subject)'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {msg.snippet || 'No preview text available'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Message Detail Viewer */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs min-h-[500px] flex flex-col">
                {selectedMessage ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedMessage.subject || '(No Subject)'}
                        </h3>
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">From: </span>
                          <span>{selectedMessage.from}</span>
                        </div>
                        {selectedMessage.to && (
                          <div className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">To: </span>
                            <span>{selectedMessage.to}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">
                          {selectedMessage.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setComposeTo(selectedMessage.from || '');
                            setComposeSubject(`Re: ${selectedMessage.subject}`);
                            setActiveTab('compose');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                        <button
                          onClick={() => triggerDeleteMessage(selectedMessage)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="flex-1 bg-slate-50/60 rounded-xl p-4 border border-slate-100 overflow-y-auto max-h-[460px] text-xs text-slate-800 leading-relaxed">
                      {isLoadingDetail ? (
                        <div className="flex items-center justify-center h-32 text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                          <span>Loading full email body...</span>
                        </div>
                      ) : selectedMessage.bodyHtml ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">
                          {selectedMessage.bodyText || selectedMessage.snippet || 'No message content.'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
                    <Mail className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Select an email to read</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Choose any message from the left inbox stream to inspect sender headers, details, or reply.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUICK DISPATCH TO PARENTS */}
          {activeTab === 'quick-dispatch' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Selector */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Parent Notification Generator</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a learner to automatically assemble certified notifications with school branding.
                  </p>
                </div>

                {/* Template Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Communication Purpose</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDispatchType('fee')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dispatchType === 'fee'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-700 mb-1" />
                      <div className="text-xs">Fee Arrears Notice</div>
                      <div className="text-[10px] text-slate-500 font-normal">M-Pesa Paybill & Balance</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchType('cbc')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dispatchType === 'cbc'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-700 mb-1" />
                      <div className="text-xs">CBC Evaluation</div>
                      <div className="text-[10px] text-slate-500 font-normal">Term Performance Brief</div>
                    </button>
                  </div>
                </div>

                {/* Grade filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Filter by CBC Grade</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="All">All Grades (PP1 - Grade 9)</option>
                    {CBC_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Learner Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Choose Learner</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Choose Learner ({filteredStudents.length} available) --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.regNo}) · {s.grade} {s.feeBalance ? `· KES ${s.feeBalance.toLocaleString()}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Details summary */}
                {selectedStudentId && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">Learner Guardian Details:</div>
                    {(() => {
                      const st = students.find(s => s.id === selectedStudentId);
                      return (
                        <>
                          <div>Guardian: <span className="font-semibold text-slate-700">{st?.guardianName || 'Guardian on file'}</span></div>
                          <div>Email: <span className="font-semibold text-slate-700">{st?.guardianEmail || `${st?.regNo.toLowerCase()}@parents.westendstar.ac.ke`}</span></div>
                          <div>Phone: <span className="font-semibold text-slate-700">{st?.guardianPhone || '0700000000'}</span></div>
                          <div>Outstanding Fee: <span className="font-semibold text-rose-700">KES {(st?.feeBalance || 0).toLocaleString()}</span></div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Right Preview & Dispatch */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Email Live Preview</h3>
                    <p className="text-xs text-slate-400">Verified HTML payload to be transmitted via Gmail</p>
                  </div>
                  {previewPayload && (
                    <button
                      type="button"
                      onClick={triggerDispatchQuickEmail}
                      disabled={isSending}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Sending...' : 'Dispatch via Gmail'}</span>
                    </button>
                  )}
                </div>

                {previewPayload ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div><strong className="text-slate-700">To:</strong> {previewPayload.to}</div>
                      <div><strong className="text-slate-700">Subject:</strong> {previewPayload.subject}</div>
                    </div>

                    <div 
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto max-h-[460px]"
                      dangerouslySetInnerHTML={{ __html: previewPayload.body }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No learner selected</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a learner on the left to preview their customized statement</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPOSE CUSTOM EMAIL */}
          {activeTab === 'compose' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl mx-auto space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compose Official Email</h3>
                  <p className="text-xs text-slate-400">Sent directly from your authenticated Google Workspace address</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={triggerSendEmail}
                    disabled={isSending}
                    className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">To (Recipient Email)</label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="parent@example.com, teacher@westendstar.ac.ke..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CC / Copy (Optional)</label>
                  <input
                    type="email"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="headteacher@westendstar.ac.ke"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="e.g. West End Star Academy - Official Term Briefing"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Message Body</label>
                  <textarea
                    rows={12}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Type official correspondence here..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <WorkspaceConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        itemName={confirmDialog.itemName}
        type={confirmDialog.type}
        isLoading={isSending}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
