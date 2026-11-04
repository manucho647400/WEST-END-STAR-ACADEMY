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
  listClassroomCourses, 
  createClassroomCourse, 
  listCourseWork, 
  createCourseWork, 
  deleteCourseWork, 
  listCourseStudents, 
  listCourseAnnouncements, 
  createCourseAnnouncement,
  ClassroomCourse, 
  ClassroomCourseWork, 
  ClassroomStudent, 
  ClassroomAnnouncement 
} from '../services/classroomService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WorkspaceConfirmDialog } from './WorkspaceConfirmDialog';
import { CBC_GRADES } from '../data/initialData';
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Users, 
  Megaphone, 
  ExternalLink, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ArrowRight,
  ClipboardList,
  Layers,
  Sparkles,
  ChevronRight,
  Share2
} from 'lucide-react';

export const ClassroomModule: React.FC = () => {
  const { students, staff, academy } = useSchool();
  const { currentUser } = useAuth();

  const [accessToken, setAccessToken] = useState<string | null>(() => getGoogleAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Selected Course
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseTab, setCourseTab] = useState<'work' | 'announcements' | 'students'>('work');

  // Coursework state
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [isLoadingWork, setIsLoadingWork] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Students state
  const [classroomStudents, setClassroomStudents] = useState<ClassroomStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Modals state
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('2026 Academic Year');
  const [newCourseHeading, setNewCourseHeading] = useState('West End Star Academy CBC');

  const [isCreateWorkOpen, setIsCreateWorkOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkDesc, setNewWorkDesc] = useState('');
  const [newWorkPoints, setNewWorkPoints] = useState<number>(50);
  const [newWorkDueDays, setNewWorkDueDays] = useState<number>(7);

  const [isPostAnnouncementOpen, setIsPostAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // Confirmation & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        fetchCourses(token);
      },
      () => {
        setAccessToken(null);
        setCourses([]);
        setSelectedCourse(null);
      }
    );

    if (accessToken) {
      fetchCourses(accessToken);
    }

    return () => unsubscribe();
  }, []);

  const fetchCourses = async (token: string) => {
    setIsLoadingCourses(true);
    try {
      const res = await listClassroomCourses({ token });
      setCourses(res.courses);
      if (res.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(res.courses[0]);
      }
    } catch (err: any) {
      console.error('Classroom load error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load Classroom courses.' });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Load details when selectedCourse changes
  useEffect(() => {
    if (selectedCourse && accessToken) {
      loadCourseWork(selectedCourse.id, accessToken);
      loadAnnouncements(selectedCourse.id, accessToken);
      loadStudents(selectedCourse.id, accessToken);
    }
  }, [selectedCourse, accessToken]);

  const loadCourseWork = async (courseId: string, token: string) => {
    setIsLoadingWork(true);
    try {
      const res = await listCourseWork(courseId, { token });
      setCourseWork(res.courseWork);
    } catch (err: any) {
      console.error('Coursework error:', err);
    } finally {
      setIsLoadingWork(false);
    }
  };

  const loadAnnouncements = async (courseId: string, token: string) => {
    setIsLoadingAnnouncements(true);
    try {
      const list = await listCourseAnnouncements(courseId, token);
      setAnnouncements(list);
    } catch (err: any) {
      console.error('Announcements error:', err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const loadStudents = async (courseId: string, token: string) => {
    setIsLoadingStudents(true);
    try {
      const list = await listCourseStudents(courseId, token);
      setClassroomStudents(list);
    } catch (err: any) {
      console.error('Students error:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const { accessToken: token } = await signInWithGoogleWorkspace();
      setAccessToken(token);
      await fetchCourses(token);
      setFeedback({ type: 'success', message: 'Successfully connected to Google Classroom!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to authenticate with Google.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleWorkspace();
    setAccessToken(null);
    setCourses([]);
    setSelectedCourse(null);
    setFeedback({ type: 'success', message: 'Disconnected from Google Workspace.' });
  };

  // Create Course Confirmation
  const triggerCreateCourse = () => {
    if (!newCourseName.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a course title.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Provision Google Classroom Course',
      message: `Create new Google Classroom course "${newCourseName}" in your connected Google account?`,
      itemName: newCourseName,
      type: 'primary',
      action: async () => {
        setIsSubmitting(true);
        try {
          const created = await createClassroomCourse({
            name: newCourseName.trim(),
            section: newCourseSection.trim(),
            descriptionHeading: newCourseHeading.trim(),
          }, accessToken || undefined);

          setCourses(prev => [created, ...prev]);
          setSelectedCourse(created);
          setIsCreateCourseOpen(false);
          setNewCourseName('');
          setFeedback({
            type: 'success',
            message: `Classroom course "${created.name}" provisioned successfully!`,
            link: created.alternateLink,
          });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to create course.' });
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Create Coursework Task Confirmation
  const triggerCreateCourseWork = () => {
    if (!selectedCourse) return;
    if (!newWorkTitle.trim()) {
      setFeedback({ type: 'error', message: 'Please provide an assignment title.' });
      return;
    }

    const today = new Date();
    const dueDateObj = new Date(today.getTime() + newWorkDueDays * 24 * 60 * 60 * 1000);

    setConfirmDialog({
      isOpen: true,
      title: 'Publish Classroom Assessment / Task',
      message: `Publish "${newWorkTitle}" to all learners in ${selectedCourse.name}?`,
      itemName: `${newWorkPoints} Points · Due ${dueDateObj.toLocaleDateString()}`,
      type: 'primary',
      action: async () => {
        setIsSubmitting(true);
        try {
          const created = await createCourseWork(selectedCourse.id, {
            title: newWorkTitle.trim(),
            description: newWorkDesc.trim(),
            maxPoints: newWorkPoints,
            workType: 'ASSIGNMENT',
            dueDate: {
              year: dueDateObj.getFullYear(),
              month: dueDateObj.getMonth() + 1,
              day: dueDateObj.getDate(),
            },
            dueTime: { hours: 20, minutes: 59 },
          }, accessToken || undefined);

          setCourseWork(prev => [created, ...prev]);
          setIsCreateWorkOpen(false);
          setNewWorkTitle('');
          setNewWorkDesc('');
          setFeedback({
            type: 'success',
            message: `Assignment "${created.title}" published to Google Classroom!`,
            link: created.alternateLink,
          });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to create assignment.' });
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete CourseWork Confirmation
  const triggerDeleteWork = (work: ClassroomCourseWork) => {
    if (!selectedCourse) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Assignment',
      message: `Are you sure you want to delete "${work.title}" from Google Classroom? This cannot be undone.`,
      itemName: work.title,
      type: 'danger',
      action: async () => {
        try {
          await deleteCourseWork(selectedCourse.id, work.id, accessToken || undefined);
          setCourseWork(prev => prev.filter(w => w.id !== work.id));
          setFeedback({ type: 'success', message: 'Assignment removed from Google Classroom.' });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete assignment.' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Create Announcement Confirmation
  const triggerCreateAnnouncement = () => {
    if (!selectedCourse) return;
    if (!announcementText.trim()) {
      setFeedback({ type: 'error', message: 'Please enter announcement content.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Broadcast Announcement',
      message: `Broadcast this announcement to all learners enrolled in ${selectedCourse.name}?`,
      itemName: announcementText.slice(0, 80) + '...',
      type: 'primary',
      action: async () => {
        setIsSubmitting(true);
        try {
          const created = await createCourseAnnouncement(
            selectedCourse.id,
            announcementText.trim(),
            accessToken || undefined
          );
          setAnnouncements(prev => [created, ...prev]);
          setIsPostAnnouncementOpen(false);
          setAnnouncementText('');
          setFeedback({ type: 'success', message: 'Announcement posted to class stream!' });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to post announcement.' });
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Quick Preset CBC Course Templates
  const handleQuickPresetCourse = (grade: string) => {
    setNewCourseName(`West End Star Academy - ${grade}`);
    setNewCourseSection(`Academic Year 2026 · CBC Curriculum`);
    setNewCourseHeading(`Kenya Competency-Based Curriculum (${grade})`);
    setIsCreateCourseOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
                Google Classroom Integration
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                CBC Virtual Classrooms
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync CBC grade cohorts, publish homework tasks & assignments, broadcast circulars, and monitor learner submissions.
            </p>
          </div>
        </div>

        {/* Action buttons & Connection state */}
        <div className="flex items-center gap-3">
          {accessToken ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateCourseOpen(true)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New CBC Course</span>
              </button>

              <button
                onClick={() => fetchCourses(accessToken)}
                title="Refresh courses"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCourses ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleSignOut}
                title="Disconnect Google"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              text="Connect Google Classroom"
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
            {feedback.link && (
              <a
                href={feedback.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline font-bold ml-2 text-emerald-800"
              >
                <span>Open in Google Classroom</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
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
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-100">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Connect Google Classroom</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Connect your authorized Google Workspace account to provision CBC virtual classrooms (PP1 - Grade 9), assign coursework activities, and sync learner progress with West End Star Academy.
            </p>
          </div>
          <div className="pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              text="Sign in with Google for Classroom"
              className="mx-auto"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">CBC Grades Sync</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated course setup for Pre-Primary through Junior School.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">Tasks & Grading</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Directly publish rubrics, term tasks, and mark boundaries.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">Class Stream</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Post broadcasts, circulars, and announcements directly to learners.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Courses List & Fast Provisioning */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  CBC Classrooms ({courses.length})
                </span>
                <button
                  onClick={() => setIsCreateCourseOpen(true)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </div>

              {isLoadingCourses ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                  <span className="text-xs">Loading courses...</span>
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-3">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No active classrooms yet</p>
                  <button
                    onClick={() => handleQuickPresetCourse('Grade 4')}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Quick Setup Grade 4
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                        selectedCourse?.id === course.id
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {course.name}
                        </h4>
                        {course.alternateLink && (
                          <a
                            href={course.alternateLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-emerald-700 transition-colors p-0.5"
                            title="Open in Google Classroom"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {course.section || '2026 Academic Year'}
                      </p>
                      {course.enrollmentCode && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                          <span>Code:</span>
                          <strong className="text-emerald-900">{course.enrollmentCode}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Provisioning Drawer */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Quick Setup CBC Cohorts
              </span>
              <p className="text-[11px] text-slate-500">
                1-click to prepare standard Kenya Ministry of Education classes:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['PP1', 'PP2', 'Grade 1', 'Grade 4', 'Grade 7', 'Grade 8'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleQuickPresetCourse(g)}
                    className="px-2 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition-colors"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Course View */}
          <div className="lg:col-span-8 space-y-4">
            {selectedCourse ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                {/* Course Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-display font-bold text-slate-900">
                        {selectedCourse.name}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {selectedCourse.courseState || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {selectedCourse.section || 'West End Star Academy'} · Room: {selectedCourse.room || 'Main Campus'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCourse.alternateLink && (
                      <a
                        href={selectedCourse.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Classroom</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Sub-tabs inside selected course */}
                <div className="flex border-b border-slate-200 gap-2">
                  <button
                    onClick={() => setCourseTab('work')}
                    className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      courseTab === 'work'
                        ? 'border-emerald-700 text-emerald-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>CBC Coursework & Tasks ({courseWork.length})</span>
                  </button>
                  <button
                    onClick={() => setCourseTab('announcements')}
                    className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      courseTab === 'announcements'
                        ? 'border-emerald-700 text-emerald-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Announcements ({announcements.length})</span>
                  </button>
                  <button
                    onClick={() => setCourseTab('students')}
                    className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      courseTab === 'students'
                        ? 'border-emerald-700 text-emerald-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Learner Roster ({classroomStudents.length})</span>
                  </button>
                </div>

                {/* TAB 1: COURSEWORK */}
                {courseTab === 'work' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Published Formative & Summative Tasks
                      </span>
                      <button
                        onClick={() => setIsCreateWorkOpen(true)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Assignment</span>
                      </button>
                    </div>

                    {isLoadingWork ? (
                      <div className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                        <span className="text-xs">Loading coursework...</span>
                      </div>
                    ) : courseWork.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                        <ClipboardList className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-700">No assignments created yet</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Create assessment activities and homework tasks for learners to submit through Google Classroom.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {courseWork.map((work) => (
                          <div
                            key={work.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{work.title}</h4>
                                {work.maxPoints !== undefined && (
                                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full">
                                    {work.maxPoints} Points
                                  </span>
                                )}
                              </div>
                              {work.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {work.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                                {work.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Due: {work.dueDate.day}/{work.dueDate.month}/{work.dueDate.year}</span>
                                  </span>
                                )}
                                <span>Type: {work.workType || 'ASSIGNMENT'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {work.alternateLink && (
                                <a
                                  href={work.alternateLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="View on Google Classroom"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => triggerDeleteWork(work)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ANNOUNCEMENTS */}
                {courseTab === 'announcements' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Class Broadcasts & Circulars
                      </span>
                      <button
                        onClick={() => setIsPostAnnouncementOpen(true)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Post Announcement</span>
                      </button>
                    </div>

                    {isLoadingAnnouncements ? (
                      <div className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                        <span className="text-xs">Loading announcements...</span>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                        <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-xs font-semibold text-slate-700">No broadcasts published</p>
                        <p className="text-[11px] text-slate-400">Post updates, KNEC guidelines, or homework directives to your students.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((ann) => (
                          <div key={ann.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {ann.text}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                              <span>Posted: {ann.updateTime ? new Date(ann.updateTime).toLocaleString() : 'Recently'}</span>
                              {ann.alternateLink && (
                                <a
                                  href={ann.alternateLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>View in Classroom</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: STUDENTS */}
                {courseTab === 'students' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Enrolled Classroom Learners
                      </span>
                      {selectedCourse.enrollmentCode && (
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                          Invite Code: <strong className="text-emerald-800 font-mono">{selectedCourse.enrollmentCode}</strong>
                        </div>
                      )}
                    </div>

                    {isLoadingStudents ? (
                      <div className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                        <span className="text-xs">Fetching enrolled students...</span>
                      </div>
                    ) : classroomStudents.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-700">No learners enrolled yet</p>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Share the class code <span className="font-mono font-bold text-slate-700">{selectedCourse.enrollmentCode || '(available in Classroom)'}</span> with parents and learners to join.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {classroomStudents.map((st) => (
                          <div key={st.userId} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {st.profile.name.givenName?.[0] || 'L'}
                            </div>
                            <div className="truncate text-left">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {st.profile.name.fullName || 'Student'}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {st.profile.emailAddress || 'No email provided'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Select a CBC Classroom</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Pick any class on the left to manage coursework, broadcast circulars, and monitor learner assignments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Create New Course */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Google Classroom</h3>
              <p className="text-xs text-slate-500 mt-0.5">Creates an official classroom directly in your Google account</p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Class Name</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. West End Star Academy - Grade 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Section</label>
                <input
                  type="text"
                  value={newCourseSection}
                  onChange={(e) => setNewCourseSection(e.target.value)}
                  placeholder="e.g. 2026 Academic Year"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description Heading</label>
                <input
                  type="text"
                  value={newCourseHeading}
                  onChange={(e) => setNewCourseHeading(e.target.value)}
                  placeholder="e.g. Competency Based Curriculum"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateCourseOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerCreateCourse}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Create Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Coursework */}
      {isCreateWorkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Publish CBC Assignment</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned to: {selectedCourse?.name}</p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Task / Assessment Title</label>
                <input
                  type="text"
                  value={newWorkTitle}
                  onChange={(e) => setNewWorkTitle(e.target.value)}
                  placeholder="e.g. Formative Task 1: Mathematical Pattern Models"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Instructions / Description</label>
                <textarea
                  rows={4}
                  value={newWorkDesc}
                  onChange={(e) => setNewWorkDesc(e.target.value)}
                  placeholder="Outline learner expectations, materials required, and submission instructions..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Max Points / Score</label>
                  <input
                    type="number"
                    value={newWorkPoints}
                    onChange={(e) => setNewWorkPoints(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Due In (Days)</label>
                  <input
                    type="number"
                    value={newWorkDueDays}
                    onChange={(e) => setNewWorkDueDays(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateWorkOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerCreateCourseWork}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Publish to Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Post Announcement */}
      {isPostAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Broadcast Class Announcement</h3>
              <p className="text-xs text-slate-500 mt-0.5">Target: {selectedCourse?.name}</p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Announcement Text</label>
                <textarea
                  rows={5}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Share updates with your class learners and guardians..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPostAnnouncementOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerCreateAnnouncement}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Post Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Workspace Confirmation Dialog */}
      <WorkspaceConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        itemName={confirmDialog.itemName}
        type={confirmDialog.type}
        isLoading={isSubmitting}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
