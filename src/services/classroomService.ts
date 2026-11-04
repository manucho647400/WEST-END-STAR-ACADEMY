import { getGoogleAccessToken } from './googleAuthService';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId?: string;
  creationTime?: string;
  updateTime?: string;
  enrollmentCode?: string;
  courseState?: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink?: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes?: number;
  };
  maxPoints?: number;
  workType?: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  submissionModificationMode?: string;
  creatorUserId?: string;
  topicId?: string;
}

export interface ClassroomStudent {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    emailAddress?: string;
    photoUrl?: string;
  };
}

export interface ClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  creatorUserId?: string;
}

export interface ClassroomSubmission {
  id: string;
  courseId: string;
  courseWorkId: string;
  userId: string;
  creationTime?: string;
  updateTime?: string;
  state?: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  assignedGrade?: number;
  draftGrade?: number;
  alternateLink?: string;
}

const getActiveToken = (token?: string): string => {
  const t = token || getGoogleAccessToken();
  if (!t) {
    throw new Error('Not authenticated with Google Classroom. Please sign in with Google.');
  }
  return t;
};

/**
 * List all Google Classroom courses for the authenticated user
 */
export const listClassroomCourses = async (options: {
  courseStates?: string[];
  pageSize?: number;
  pageToken?: string;
  token?: string;
} = {}): Promise<{ courses: ClassroomCourse[]; nextPageToken?: string }> => {
  const t = getActiveToken(options.token);
  const params = new URLSearchParams();
  params.set('pageSize', String(options.pageSize || 30));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.courseStates && options.courseStates.length > 0) {
    options.courseStates.forEach((state) => params.append('courseStates', state));
  } else {
    params.append('courseStates', 'ACTIVE');
  }

  const res = await fetch(`https://classroom.googleapis.com/v1/courses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Classroom courses (${res.status})`);
  }

  const data = await res.json();
  return {
    courses: data.courses || [],
    nextPageToken: data.nextPageToken,
  };
};

/**
 * Create a new Classroom course (e.g., CBC Grade 4 Mathematics)
 * An explicit user confirmation dialog MUST be shown in UI before calling this method.
 */
export const createClassroomCourse = async (
  course: {
    name: string;
    section?: string;
    descriptionHeading?: string;
    description?: string;
    room?: string;
  },
  token?: string
): Promise<ClassroomCourse> => {
  const t = getActiveToken(token);

  const payload: Record<string, any> = {
    name: course.name,
    ownerId: 'me',
    courseState: 'ACTIVE',
  };
  if (course.section) payload.section = course.section;
  if (course.descriptionHeading) payload.descriptionHeading = course.descriptionHeading;
  if (course.description) payload.description = course.description;
  if (course.room) payload.room = course.room;

  const res = await fetch('https://classroom.googleapis.com/v1/courses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create course "${course.name}"`);
  }

  return await res.json();
};

/**
 * List assignments / coursework in a course
 */
export const listCourseWork = async (
  courseId: string,
  options: { pageSize?: number; pageToken?: string; token?: string } = {}
): Promise<{ courseWork: ClassroomCourseWork[]; nextPageToken?: string }> => {
  const t = getActiveToken(options.token);
  const params = new URLSearchParams();
  params.set('pageSize', String(options.pageSize || 30));
  if (options.pageToken) params.set('pageToken', options.pageToken);

  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${t}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch coursework for course ${courseId}`);
  }

  const data = await res.json();
  return {
    courseWork: data.courseWork || [],
    nextPageToken: data.nextPageToken,
  };
};

/**
 * Create a new assignment or CBC formative task in Google Classroom.
 * User confirmation MUST be obtained in UI before invoking this method.
 */
export const createCourseWork = async (
  courseId: string,
  work: {
    title: string;
    description?: string;
    maxPoints?: number;
    workType?: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
    dueDate?: { year: number; month: number; day: number };
    dueTime?: { hours: number; minutes?: number };
  },
  token?: string
): Promise<ClassroomCourseWork> => {
  const t = getActiveToken(token);

  const payload: Record<string, any> = {
    title: work.title,
    workType: work.workType || 'ASSIGNMENT',
    state: 'PUBLISHED',
  };
  if (work.description) payload.description = work.description;
  if (typeof work.maxPoints === 'number') payload.maxPoints = work.maxPoints;
  if (work.dueDate) payload.dueDate = work.dueDate;
  if (work.dueTime) payload.dueTime = work.dueTime;

  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create assignment "${work.title}"`);
  }

  return await res.json();
};

/**
 * Delete a coursework task.
 * User confirmation MUST be obtained in UI before invoking this method.
 */
export const deleteCourseWork = async (
  courseId: string,
  courseWorkId: string,
  token?: string
): Promise<boolean> => {
  const t = getActiveToken(token);
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete assignment');
  }

  return true;
};

/**
 * List enrolled learners in a course
 */
export const listCourseStudents = async (
  courseId: string,
  token?: string
): Promise<ClassroomStudent[]> => {
  const t = getActiveToken(token);
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch students for course ${courseId}`);
  }

  const data = await res.json();
  return data.students || [];
};

/**
 * List student submissions for a specific coursework
 */
export const listStudentSubmissions = async (
  courseId: string,
  courseWorkId: string,
  token?: string
): Promise<ClassroomSubmission[]> => {
  const t = getActiveToken(token);
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
    {
      headers: { Authorization: `Bearer ${t}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch student submissions');
  }

  const data = await res.json();
  return data.studentSubmissions || [];
};

/**
 * List announcements for a course
 */
export const listCourseAnnouncements = async (
  courseId: string,
  token?: string
): Promise<ClassroomAnnouncement[]> => {
  const t = getActiveToken(token);
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/announcements?pageSize=25`,
    {
      headers: { Authorization: `Bearer ${t}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch course announcements');
  }

  const data = await res.json();
  return data.announcements || [];
};

/**
 * Create a new announcement in a course
 * User confirmation MUST be obtained in UI before invoking this method.
 */
export const createCourseAnnouncement = async (
  courseId: string,
  text: string,
  token?: string
): Promise<ClassroomAnnouncement> => {
  const t = getActiveToken(token);
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      state: 'PUBLISHED',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to post announcement');
  }

  return await res.json();
};
