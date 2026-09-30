import { api } from "../../../shared/api/api";

export type QuestionBankItem = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
  book: string;
  grade: string;
  chapter: string;
  lesson: string;
  difficulty: string;
  source: string;
  tags: string[];
  organization?: { id: string; name: string } | null;
  updatedAt: string;
};
export type QuestionBankDraft = Omit<QuestionBankItem, "id" | "organization" | "updatedAt"> & {
  organizationId: string;
};
export const listQuestionBank = (organizationId?: string) =>
  api.get<QuestionBankItem[]>(
    `/question-bank${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const createQuestionBankItem = (body: QuestionBankDraft) =>
  api.post<QuestionBankItem>("/question-bank", body);
export const updateQuestionBankItem = (id: string, body: Partial<QuestionBankDraft>) =>
  api.patch<QuestionBankItem>(`/question-bank/${encodeURIComponent(id)}`, body);
export const archiveQuestionBankItem = (id: string) =>
  api.delete<{ archived: boolean }>(`/question-bank/${encodeURIComponent(id)}`);
export const addBankItemToExam = (id: string, examId: string) =>
  api.post(`/question-bank/${encodeURIComponent(id)}/add-to-exam`, { examId });
export const addBankItemToQuiz = (id: string, quizId: string) =>
  api.post(`/question-bank/${encodeURIComponent(id)}/add-to-quiz`, { quizId });
export type QuestionBankGeneration = { examId: string; subject?: string; topic?: string; grade?: string; chapter?: string; easy?: number; medium?: number; hard?: number; itemIds?: string[]; commit?: boolean };
export const generateExamFromBank = (body: QuestionBankGeneration) => api.post<{ preview: boolean; created?: number; skipped?: number; selected?: Array<{ id: string; text: string; difficulty: string }> }>("/question-bank/generate/exam", body);
