import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "../pages/Home.css";

const DEFAULT_QUIZ_SET = "Quiz 1";
const EMPTY_OPTIONS = ["", "", "", ""];

function normalizeQuizSet(value) {
  return value?.trim() || DEFAULT_QUIZ_SET;
}

function deriveCorrectOptionIndex(questionItem) {
  if (!Array.isArray(questionItem?.options)) return null;
  const index = questionItem.options.findIndex((option) => option === questionItem.correctAnswer);
  return index >= 0 ? index : null;
}

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.response?.data || fallback;
}

export default function CreateQuiz() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [quizSet, setQuizSet] = useState(DEFAULT_QUIZ_SET);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (videoId) {
      fetchQuiz();
    }
  }, [videoId]);

  const groupedQuestions = useMemo(() => {
    const grouped = existingQuestions.reduce((acc, questionItem) => {
      const key = normalizeQuizSet(questionItem.quizSet);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(questionItem);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right));
  }, [existingQuestions]);

  const quizSetNames = useMemo(() => groupedQuestions.map(([setName]) => setName), [groupedQuestions]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/admin/${videoId}`, {
        withCredentials: true,
      });
      setExistingQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFormError(errorMessage(err, "Failed to load quiz questions."));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (nextQuizSet = quizSet) => {
    setEditingQuestionId(null);
    setQuizSet(normalizeQuizSet(nextQuizSet));
    setQuestion("");
    setOptions(EMPTY_OPTIONS);
    setCorrectOptionIndex(null);
  };

  const handleOptionChange = (index, value) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const buildPayload = () => {
    const normalizedQuestion = question.trim();
    const normalizedQuizSet = normalizeQuizSet(quizSet);
    const normalizedOptions = options.map((option) => option.trim());

    if (!normalizedQuestion) {
      throw new Error("Question is required.");
    }
    if (normalizedOptions.some((option) => !option)) {
      throw new Error("All answer options are required.");
    }
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      throw new Error("Options must be unique.");
    }
    if (correctOptionIndex === null || correctOptionIndex < 0 || correctOptionIndex >= normalizedOptions.length) {
      throw new Error("Choose the correct option.");
    }

    return {
      videoId: Number(videoId),
      quizSet: normalizedQuizSet,
      question: normalizedQuestion,
      options: normalizedOptions,
      correctAnswer: normalizedOptions[correctOptionIndex],
    };
  };

  const handleSubmit = async () => {
    try {
      const payload = buildPayload();
      setSubmitting(true);
      setFormError("");

      if (editingQuestionId) {
        await api.put(`/quizzes/update/${editingQuestionId}`, payload, { withCredentials: true });
      } else {
        await api.post("/quizzes/create", payload, { withCredentials: true });
      }

      const activeQuizSet = payload.quizSet;
      resetForm(activeQuizSet);
      await fetchQuiz();
    } catch (err) {
      setFormError(errorMessage(err, err.message || "Unable to save the quiz question."));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (questionItem) => {
    setEditingQuestionId(questionItem.id);
    setQuizSet(normalizeQuizSet(questionItem.quizSet));
    setQuestion(questionItem.question || "");
    setOptions(Array.isArray(questionItem.options) ? [...questionItem.options] : EMPTY_OPTIONS);
    setCorrectOptionIndex(deriveCorrectOptionIndex(questionItem));
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;

    try {
      setFormError("");
      await api.delete(`/quizzes/delete/${id}`, { withCredentials: true });
      await fetchQuiz();
    } catch (err) {
      setFormError(errorMessage(err, "Unable to delete the question."));
    }
  };

  return (
    <div className="modern-home-page">
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell pt-8 pb-14 min-h-screen flex flex-col gap-6 animate-in" style={{ animationDelay: "100ms" }}>
        <section className="premium-glass rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#eadfca] text-[#876d47] text-[11px] font-bold tracking-[0.16em] uppercase shadow-sm">
                Quiz Set Builder
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#2d2926] mt-4 tracking-tight">Create multiple quizzes for one video</h1>
              <p className="text-[#5c544d] mt-3 text-base md:text-lg leading-relaxed">
                Group questions into sets like <span className="font-bold text-[#2d2926]">Quiz 1</span> and <span className="font-bold text-[#2d2926]">Quiz 2</span>. Learners are assigned one set per video, and the correct answer is selected from the options instead of typed separately.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Resources
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl border border-[#d6eadc] bg-[#f7fbf8] p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#6f917e]">Quiz Sets</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{groupedQuestions.length}</p>
            </div>
            <div className="rounded-2xl border border-[#eadfca] bg-[#fffaf3] p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#876d47]">Questions</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{existingQuestions.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e8e4db] bg-white/80 p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#5c544d]">Video</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">#{videoId}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.35fr] gap-6 items-start">
          <div className="premium-glass rounded-[32px] p-6 md:p-7 sticky top-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#2d2926]">{editingQuestionId ? "Edit Question" : "Create Question"}</h2>
                <p className="text-sm text-[#827a71] mt-1">Choose a quiz set first, then add the question and mark the correct option.</p>
              </div>
              {editingQuestionId && (
                <span className="px-3 py-1 rounded-full bg-[#ebf5ed] border border-[#d6eadc] text-[#6f917e] text-xs font-bold tracking-[0.14em] uppercase">
                  Editing
                </span>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-[0.16em] mb-2">Quiz Set</label>
                <input
                  type="text"
                  value={quizSet}
                  onChange={(e) => setQuizSet(e.target.value)}
                  placeholder="Quiz 1"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
                <p className="mt-2 text-xs text-[#827a71]">Questions with the same set name belong to the same quiz.</p>

                {quizSetNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {quizSetNames.map((setName) => (
                      <button
                        key={setName}
                        type="button"
                        onClick={() => setQuizSet(setName)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold tracking-[0.14em] uppercase transition-colors ${
                          normalizeQuizSet(quizSet) === setName
                            ? "bg-[#876d47] text-white border-[#876d47]"
                            : "bg-white text-[#876d47] border-[#eadfca] hover:bg-[#faf5eb]"
                        }`}
                      >
                        {setName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-[0.16em] mb-2">Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type the quiz question here"
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all resize-y"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <label className="block text-xs font-bold text-[#827a71] uppercase tracking-[0.16em]">Options</label>
                  <span className="text-xs text-[#827a71]">Pick one correct answer</span>
                </div>

                <div className="grid gap-3">
                  {options.map((option, index) => {
                    const isCorrect = correctOptionIndex === index;

                    return (
                      <div
                        key={index}
                        className={`rounded-[24px] border p-3.5 transition-all ${
                          isCorrect
                            ? "border-[#cce4d2] bg-[#ebf5ed]"
                            : "border-[#e8e4db] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-sm font-bold ${
                            isCorrect
                              ? "bg-[#6f917e] text-white border-[#6f917e]"
                              : "bg-[#faf5eb] text-[#876d47] border-[#eadfca]"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>

                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 bg-transparent text-[#2d2926] text-sm focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => setCorrectOptionIndex(index)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                              isCorrect
                                ? "bg-[#6f917e] text-white"
                                : "bg-[#f1efe9] text-[#5c544d] hover:bg-[#e8e4db]"
                            }`}
                          >
                            {isCorrect ? "Correct" : "Mark Correct"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="rounded-2xl border border-[#f3d3cd] bg-[#fcf1ef] px-4 py-3 text-sm text-[#b3473a]">
                  {formError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 min-w-[180px] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-transform"
                >
                  {submitting ? "Saving..." : editingQuestionId ? "Update Question" : "Add Question"}
                </button>

                <button
                  type="button"
                  onClick={() => resetForm(DEFAULT_QUIZ_SET)}
                  className="px-4 py-3 rounded-2xl bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </div>
          </div>

          <div className="premium-glass rounded-[32px] p-6 md:p-7 min-h-[540px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#2d2926]">Quiz Sets</h2>
                <p className="text-sm text-[#827a71] mt-1">Questions are grouped by set so you can see exactly what learners may receive.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e8e4db] text-xs font-bold tracking-[0.14em] uppercase text-[#876d47]">
                {existingQuestions.length} total question{existingQuestions.length === 1 ? "" : "s"}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[320px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="uni-task-spinner" />
                  <p className="text-[#827a71] font-medium">Loading quiz sets...</p>
                </div>
              </div>
            ) : groupedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] rounded-[28px] border border-[#e8e4db] border-dashed bg-white/40 px-6 text-center">
                <svg className="w-14 h-14 text-[#b49060]/35 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#827a71] font-medium">No quiz sets yet for this video.</p>
                <p className="text-[#a39c93] text-sm mt-1">Create `Quiz 1`, `Quiz 2`, or any set name on the left.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedQuestions.map(([setName, questions]) => (
                  <section key={setName} className="rounded-[28px] border border-[#eadfca] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(252,248,241,0.92))] p-4 md:p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[#f1efe9]">
                      <div>
                        <h3 className="text-lg font-extrabold text-[#2d2926]">{setName}</h3>
                        <p className="text-sm text-[#827a71] mt-1">New users are distributed across available quiz sets for this video.</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-white border border-[#e8e4db] text-xs font-bold tracking-[0.14em] uppercase text-[#876d47]">
                        {questions.length} question{questions.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {questions.map((questionItem, index) => {
                        const correctIndex = deriveCorrectOptionIndex(questionItem);

                        return (
                          <article key={questionItem.id} className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-[0_12px_36px_rgba(59,44,26,0.06)]">
                            <div className="flex gap-4">
                              <div className="w-9 h-9 rounded-2xl bg-[#faf5eb] border border-[#eadfca] text-[#876d47] flex items-center justify-center text-sm font-bold shrink-0">
                                {index + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                  <h4 className="text-base font-bold text-[#2d2926] leading-relaxed">{questionItem.question}</h4>
                                  <span className="px-3 py-1 rounded-full bg-[#ebf5ed] text-[#6f917e] border border-[#d6eadc] text-[11px] font-bold tracking-[0.14em] uppercase">
                                    {setName}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {questionItem.options.map((option, optionIndex) => {
                                    const isCorrect = correctIndex === optionIndex;

                                    return (
                                      <div
                                        key={`${questionItem.id}-${optionIndex}`}
                                        className={`flex items-center gap-3 rounded-2xl border p-3 ${
                                          isCorrect
                                            ? "bg-[#ebf5ed] border-[#cce4d2]"
                                            : "bg-[#fcfbf9] border-[#e8e4db]"
                                        }`}
                                      >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          isCorrect ? "bg-[#6f917e] text-white" : "bg-[#e8e4db] text-[#827a71]"
                                        }`}>
                                          {String.fromCharCode(65 + optionIndex)}
                                        </div>
                                        <span className={`text-sm ${isCorrect ? "font-semibold text-[#2d2926]" : "text-[#5c544d]"}`}>
                                          {option}
                                        </span>
                                        {isCorrect && (
                                          <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f917e]">
                                            Correct
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-wrap gap-2 justify-end mt-4 pt-4 border-t border-[#f1efe9]">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(questionItem)}
                                    className="px-4 py-2 rounded-xl bg-[#f1efe9] text-[#5c544d] text-sm font-bold hover:bg-[#e8e4db] transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteQuestion(questionItem.id)}
                                    className="px-4 py-2 rounded-xl bg-[#fcf1ef] text-[#c36254] text-sm font-bold hover:bg-[#f7e2de] transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
