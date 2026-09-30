import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { QuestionBankItem } from "../../database/entities/question-bank-item.entity";
import { Exam } from "../../database/entities/exam.entity";
import { Question } from "../../database/entities/question.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { GenerateExamFromBankDto } from "./question-bank.dto";
@Injectable()
export class QuestionBankService {
  constructor(
    @InjectRepository(QuestionBankItem)
    private readonly items: Repository<QuestionBankItem>,
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    private readonly authz: AuthorizationService,
  ) {}
  async list(c: UserContext, organizationId?: string) {
    return (
      await this.items.find({
        where: { archivedAt: IsNull() },
        relations: { organization: true },
        order: { updatedAt: "DESC" },
      })
    ).filter((x) => this.allowed(c, organizationId ?? x.organization?.id));
  }
  async save(c: UserContext, body: Record<string, unknown>, id?: string) {
    const orgId = String(body.organizationId || c.organizationIds[0] || "");
    if (!this.allowed(c, orgId))
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "Organization access is required.",
      );
    let item = id
      ? await this.items.findOne({
          where: { id },
          relations: { organization: true },
        })
      : this.items.create();
    if (!item || !this.allowed(c, item.organization?.id || orgId))
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item not found.",
      );
    const options = Array.isArray(body.options)
      ? body.options.map(String).map((x) => x.trim())
      : [];
    const correct = String(body.correctAnswer || "").trim();
    if (
      options.length !== 4 ||
      options.some((x) => !x) ||
      new Set(options.map((x) => x.toLowerCase())).size !== 4 ||
      !options.includes(correct)
    )
      throw new ApiException(
        400,
        "INVALID_QUESTION",
        "Four unique options and a valid correct answer are required.",
      );
    Object.assign(item, {
      ...body,
      options,
      correctAnswer: correct,
      organization: { id: orgId },
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    });
    return this.items.save(item);
  }
  async archive(c: UserContext, id: string) {
    const item = await this.items.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!item || !this.allowed(c, item.organization?.id))
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item not found.",
      );
    item.archivedAt = new Date();
    await this.items.save(item);
    return { id, archived: true };
  }
  async copyToExam(c: UserContext, id: string, examId: string) {
    const [item, exam] = await Promise.all([
      this.items.findOne({ where: { id }, relations: { organization: true } }),
      this.exams.findOne({
        where: { id: examId },
        relations: { organization: true },
      }),
    ]);
    if (
      !item ||
      !exam ||
      !this.allowed(c, item.organization?.id) ||
      !this.allowed(c, exam.organization?.id)
    )
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item or exam not found.",
      );
    const sortOrder =
      (await this.questions.count({ where: { exam: { id: exam.id } } })) + 1;
    return this.questions.save(
      this.questions.create({
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        subject: item.subject,
        topic: item.topic,
        book: item.book,
        grade: item.grade,
        chapter: item.chapter,
        lesson: item.lesson,
        difficulty: item.difficulty,
        source: item.source,
        tags: item.tags,
        sectionId: "",
        sortOrder,
        exam,
        questionBankItemId: item.id,
      }),
    );
  }
  async generateExam(c: UserContext, dto: GenerateExamFromBankDto) {
    const exam = await this.exams.findOne({ where: { id: dto.examId }, relations: { organization: true } });
    if (!exam || !this.allowed(c, exam.organization?.id)) throw new ApiException(404, "EXAM_NOT_FOUND", "Exam not found.");
    const pool = (await this.items.find({ where: { archivedAt: IsNull() }, relations: { organization: true }, order: { updatedAt: "DESC" } })).filter(item => this.allowed(c, item.organization?.id) && item.organization?.id === exam.organization?.id && (!dto.subject || item.subject === dto.subject) && (!dto.topic || item.topic === dto.topic) && (!dto.grade || item.grade === dto.grade) && (!dto.chapter || item.chapter === dto.chapter));
    const requested = dto.itemIds?.length ? pool.filter(item => dto.itemIds!.includes(item.id)) : this.pickBalanced(pool, dto);
    if (!requested.length) throw new ApiException(422, "QUESTION_BANK_EMPTY", "No matching question-bank items found.");
    if (!dto.commit) return { preview: true, requested: this.requestedCounts(dto), selected: requested.map(item => ({ id: item.id, text: item.text, difficulty: item.difficulty, subject: item.subject, topic: item.topic })) };
    const existing = await this.questions.find({ where: { exam: { id: exam.id } } });
    const sourceIds = new Set(existing.map(question => question.questionBankItemId).filter(Boolean));
    const items = requested.filter(item => !sourceIds.has(item.id));
    const start = existing.length + 1;
    const created = await this.questions.save(items.map((item,index) => this.questions.create({ text:item.text, options:item.options, correctAnswer:item.correctAnswer, explanation:item.explanation, subject:item.subject, topic:item.topic, book:item.book, grade:item.grade, chapter:item.chapter, lesson:item.lesson, difficulty:item.difficulty, source:item.source, tags:item.tags, sectionId:"", sortOrder:start+index, exam, questionBankItemId:item.id })));
    return { preview:false, created:created.length, skipped:requested.length-created.length, questions:created };
  }
  async copyToQuiz(c: UserContext, id: string, quizId: string) {
    const [item, quiz] = await Promise.all([
      this.items.findOne({ where: { id }, relations: { organization: true } }),
      this.quizzes.findOne({
        where: { id: quizId },
        relations: { organization: true, exam: { organization: true } },
      }),
    ]);
    const organizationId =
      quiz?.organization?.id ?? quiz?.exam?.organization?.id;
    if (
      !item ||
      !quiz ||
      !this.allowed(c, item.organization?.id) ||
      !this.allowed(c, organizationId)
    )
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item or quiz not found.",
      );
    const sortOrder =
      (await this.quizQuestions.count({ where: { quiz: { id: quiz.id } } })) +
      1;
    return this.quizQuestions.save(
      this.quizQuestions.create({
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        sortOrder,
        quiz,
        questionBankItemId: item.id,
      }),
    );
  }
  private allowed(c: UserContext, id?: string) {
    return (
      c.roles.includes("PLATFORM_ADMIN") ||
      (!!id && this.authz.canAccessOrganization(c, id, "question_bank.manage"))
    );
  }
  private requestedCounts(dto: GenerateExamFromBankDto) { return { easy: dto.easy || 0, medium: dto.medium || 0, hard: dto.hard || 0 }; }
  private pickBalanced(pool: QuestionBankItem[], dto: GenerateExamFromBankDto) { const counts=this.requestedCounts(dto); const chosen:QuestionBankItem[]=[]; for(const [difficulty,count] of Object.entries(counts)){ const options=pool.filter(item=>item.difficulty===difficulty); for(let index=0;index<count&&index<options.length;index++) chosen.push(options[index]); } return chosen; }
}
