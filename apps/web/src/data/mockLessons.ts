export type LessonStatus = 'todo' | 'doing' | 'done'

export type MockLesson = {
  id: string
  title: string
  level: string
  progress: number
  status: LessonStatus
}

export type MockCue = {
  id: string
  start: number
  text: string
}

export const statusLabels: Record<LessonStatus, string> = {
  todo: '未开始',
  doing: '学习中',
  done: '已完成',
}

export const mockLessons: MockLesson[] = [
  { id: '0001', title: 'At the Restaurant', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0002', title: 'Calling in Sick', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0003', title: 'At the Hotel', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0004', title: 'Asking for an Assistant', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0005', title: 'Cutting in Line', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0006', title: 'Travel Plans', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0007', title: 'Computer Viruses', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0008', title: 'Foreign Investment', level: 'Beginner', progress: 42, status: 'doing' },
  { id: '0009', title: 'Understanding Others', level: 'Beginner', progress: 0, status: 'todo' },
  { id: '0010', title: 'Sales Strategies', level: 'Beginner', progress: 100, status: 'done' },
]

export const mockCues: MockCue[] = [
  { id: 'cue-001', start: 0, text: 'Hello English learners and welcome to EnglishPod.' },
  { id: 'cue-002', start: 6.84, text: 'My name is Marco.' },
  { id: 'cue-003', start: 8.08, text: "I'm Amira." },
  { id: 'cue-004', start: 9.2, text: 'And Amira and I are here today with a great, great lesson for you.' },
  { id: 'cue-005', start: 14.6, text: 'Yes, we are.' },
  { id: 'cue-006', start: 15.84, text: "Today we're going to be talking about a restaurant." },
  { id: 'cue-007', start: 18.56, text: "Amira, why don't you give us a little bit more details?" },
  {
    id: 'cue-008',
    start: 21.04,
    text: 'Well, we are talking about a situation in a restaurant and two people are involved, the waiter and the customer.',
  },
  { id: 'cue-009', start: 29.64, text: "And I don't want to say any more." },
  { id: 'cue-010', start: 31, text: "Okay, don't say any more." },
  { id: 'cue-011', start: 32.68, text: "Let's just listen to this dialogue and we'll be back later to explain it." },
  { id: 'cue-012', start: 44.72, text: 'Good evening. My name is Fabio.' },
  { id: 'cue-013', start: 46.72, text: "I'll be your waiter for tonight. May I take your order?" },
  { id: 'cue-014', start: 49.44, text: "No, I'm still working on it." },
  { id: 'cue-015', start: 51.94, text: 'This menu is not even in English.' },
  { id: 'cue-016', start: 54.08, text: "What's good here?" },
  { id: 'cue-017', start: 56.08, text: 'For you, sir, I would recommend spaghetti and meatballs.' },
  { id: 'cue-018', start: 60.72, text: 'Does it come with coke and fries?' },
  {
    id: 'cue-019',
    start: 63.68,
    text: 'It comes with either soup or salad and a complimentary glass of wine, sir.',
  },
  { id: 'cue-020', start: 71.2, text: "I'll go with the spaghetti and meatballs, salad and the wine." },
  { id: 'cue-021', start: 75.6, text: 'Excellent choice.' },
  { id: 'cue-022', start: 77.56, text: 'Your order will be ready soon.' },
  { id: 'cue-023', start: 80.32, text: 'How soon is soon?' },
  { id: 'cue-024', start: 82.56, text: 'Twenty minutes.' },
  { id: 'cue-025', start: 84.48, text: "You know what? I'll go grab a burger across the street." },
  { id: 'cue-026', start: 87.4, text: 'What a waiter!' },
]

export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
