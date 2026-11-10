import { useEffect, useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  X,
  Loader2,
  ListTodo,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type TodoItem,
} from "../../../services/todoService";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

// Helper to format date as YYYY-MM-DD
const formatDateIso = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type StatusFilterType = "ALL" | "PENDING" | "COMPLETED";
type PriorityFilterType = "ALL" | "HIGH" | "MEDIUM" | "LOW";

const Todo = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  // Date selection state - DEFAULT IS TODAY
  const [selectedDate, setSelectedDate] = useState<string>(formatDateIso(new Date()));
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterType>("ALL");

  // Modal / Drawer state for Create or Edit (Sliding from Right)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState(selectedDate);
  const [formPriority, setFormPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const loadTodos = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodos(accessToken, selectedDate);
      setTodos(data);
    } catch (err: any) {
      console.error("Failed to load todos:", err);
      const msg = err.message || "Failed to load todos";
      setError(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [accessToken, selectedDate]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateIso(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateIso(d));
  };

  const handleToday = () => {
    setSelectedDate(formatDateIso(new Date()));
  };

  // Toggle Completion Status
  const handleToggleComplete = async (todo: TodoItem) => {
    if (!accessToken) return;
    const newStatus = !todo.isCompleted;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: newStatus } : t))
    );

    try {
      await updateTodo(accessToken, todo.id, { isCompleted: newStatus });
      toast.showToast(
        newStatus ? "Marked task as completed" : "Marked task as pending",
        "success"
      );
    } catch (err: any) {
      // Revert optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t))
      );
      toast.showToast(err.message || "Failed to update todo status", "error");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTodo(null);
    setFormTitle("");
    setFormDescription("");
    setFormDueDate(selectedDate);
    setFormPriority("MEDIUM");
    setIsClosing(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDescription(todo.description || "");
    const dateFormatted = todo.dueDate ? todo.dueDate.split("T")[0] : selectedDate;
    setFormDueDate(dateFormatted);
    setFormPriority(todo.priority || "MEDIUM");
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsModalOpen(false);
      setEditingTodo(null);
    }
  };

  // Save Todo (Create or Edit)
  const handleSaveTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formTitle.trim()) {
      toast.showToast("Please enter a todo title", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTodo) {
        await updateTodo(accessToken, editingTodo.id, {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          dueDate: formDueDate,
          priority: formPriority,
        });
        toast.showToast("Updated todo successfully", "success");
      } else {
        await createTodo(accessToken, {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          dueDate: formDueDate,
          priority: formPriority,
        });
        toast.showToast("Created new todo", "success");
      }

      handleCloseModal();
      loadTodos();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to save todo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Todo
  const handleDeleteTodo = async (id: string, title: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteTodo(accessToken, id);
      toast.showToast("Todo deleted", "success");
      loadTodos();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to delete todo", "error");
    }
  };

  // Filter Todos
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (todo.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "PENDING" && todo.isCompleted) return false;
    if (statusFilter === "COMPLETED" && !todo.isCompleted) return false;

    if (priorityFilter !== "ALL" && todo.priority !== priorityFilter) return false;

    return true;
  });

  const isTodaySelected = selectedDate === formatDateIso(new Date());

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const highPriorityCount = todos.filter((t) => t.priority === "HIGH" && !t.isCompleted).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-5">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <ListTodo size={20} className="sm:w-[26px] sm:h-[26px] text-primary-600 shrink-0" />
            My Todo List
          </h1>
          <p className="hidden sm:block mt-1 text-xs sm:text-sm text-text-secondary">
            Manage your daily tasks, set priorities, and track execution by date.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="
            inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 sm:px-4 py-2 sm:py-2.5
            text-xs sm:text-sm font-semibold text-white hover:bg-primary-700 transition
            self-start sm:self-auto cursor-pointer shrink-0
          "
        >
          <Plus size={15} /> Create Todo Task
        </button>
      </div>

      {/* KPI Stats summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Total Tasks</span>
            <ListTodo size={15} className="text-primary-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{totalCount}</p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">Scheduled for selected date</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Pending</span>
            <Clock size={15} className="text-blue-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">Awaiting completion</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">Tasks finished</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">High Priority</span>
            <AlertCircle size={15} className="text-red-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">{highPriorityCount}</p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">High priority pending</p>
        </div>
      </div>

      {/* Date Navigator Bar & Controls (Sitting directly on page without outer card) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Date Navigator (Reduced size, compact) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-surface rounded-lg p-1 border border-border shadow-2xs h-9">
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1 rounded text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-text-primary transition shrink-0 cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1 px-1 min-w-0">
              <Calendar size={13} className="text-primary-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer w-[110px] sm:w-[115px]"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              title="Next Day"
              className="p-1 rounded text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-text-primary transition shrink-0 cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {!isTodaySelected && (
            <button
              type="button"
              onClick={handleToday}
              className="h-9 px-2.5 rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-800/80 dark:bg-primary-950/40 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition shrink-0 cursor-pointer shadow-2xs"
            >
              Today
            </button>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto min-w-0">
          {/* Status & Priority Dropdowns (Equal width side-by-side on mobile, inline on tablet/desktop) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 h-9 rounded-lg border border-border bg-surface px-2.5 shadow-2xs min-w-0 sm:w-36">
              <CheckSquare size={13} className="text-text-muted shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL" className="bg-surface text-text-primary">All Status</option>
                <option value="PENDING" className="bg-surface text-text-primary">Pending</option>
                <option value="COMPLETED" className="bg-surface text-text-primary">Completed</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 h-9 rounded-lg border border-border bg-surface px-2.5 shadow-2xs min-w-0 sm:w-36">
              <Filter size={13} className="text-text-muted shrink-0" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilterType)}
                className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL" className="bg-surface text-text-primary">All Priorities</option>
                <option value="HIGH" className="bg-surface text-text-primary">High Priority</option>
                <option value="MEDIUM" className="bg-surface text-text-primary">Medium Priority</option>
                <option value="LOW" className="bg-surface text-text-primary">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Search Box & Refresh Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="relative flex-1 min-w-0 sm:w-56 sm:flex-none">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search todo title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3
                  text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none transition shadow-2xs
                "
              />
            </div>

            <button
              type="button"
              onClick={loadTodos}
              disabled={loading}
              title="Refresh List"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-text-primary transition shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Todo Container */}
      <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-sm min-h-[200px] sm:min-h-[350px]">
        {loading ? (
          <PageLoadingState message={`Loading your todos for ${selectedDate}...`} />
        ) : error ? (
          <PageErrorState
            title="Failed to load todos"
            message={error}
            onRetry={loadTodos}
          />
        ) : filteredTodos.length === 0 ? (
          <PageEmptyState
            icon={ListTodo}
            title="No Todo Tasks Found"
            message={
              todos.length === 0
                ? `You don't have any todo items scheduled for ${
                    selectedDate === formatDateIso(new Date()) ? "Today" : selectedDate
                  }. Click the button below to add your first task.`
                : "No todo tasks match your selected search or status filters."
            }
            actionText={todos.length === 0 ? "Add Todo Task" : undefined}
            onAction={todos.length === 0 ? handleOpenCreateModal : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTodos.map((todo) => {
              const isHigh = todo.priority === "HIGH";
              const isLow = todo.priority === "LOW";

              return (
                <div
                  key={todo.id}
                  className={`
                    group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl border transition-all duration-200
                    ${todo.isCompleted
                      ? "bg-neutral-50/70 border-border opacity-70"
                      : isHigh
                        ? "bg-red-50/20 border-red-200 hover:border-red-300 shadow-2xs"
                        : "bg-surface border-border hover:border-primary-300 shadow-2xs"
                    }
                  `}
                >
                  <div>
                    {/* Top Row: Checkbox, Title, Priority */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="mt-0.5 shrink-0 text-primary-600 hover:scale-110 transition cursor-pointer"
                        >
                          {todo.isCompleted ? (
                            <CheckSquare size={20} className="text-emerald-600" />
                          ) : (
                            <Square size={20} className="text-text-muted hover:text-primary-600" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-sm font-semibold leading-snug ${todo.isCompleted
                              ? "line-through text-text-muted"
                              : "text-text-primary"
                              }`}
                          >
                            {todo.title}
                          </h3>

                          {/* Date tag */}
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
                            <Calendar size={12} />
                            <span>
                              {new Date(todo.dueDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Priority Tag */}
                      <span
                        className={`
                          shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                          ${isHigh
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : isLow
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }
                        `}
                      >
                        {todo.priority}
                      </span>
                    </div>

                    {/* Description Notes */}
                    {todo.description && (
                      <p
                        className={`text-xs mt-3 pt-2 border-t border-border/50 whitespace-pre-wrap leading-relaxed ${todo.isCompleted ? "line-through text-text-muted" : "text-text-secondary"
                          }`}
                      >
                        {todo.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
                    <span className="text-[11px] text-text-muted font-medium truncate mr-2">
                      Status: {todo.isCompleted ? "Completed" : "Pending"}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(todo)}
                        title="Edit Task"
                        className="px-2 py-1 rounded text-xs font-medium text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={13} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteTodo(todo.id, todo.title)}
                        title="Delete Task"
                        className="px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Side Drawer Panel (Sliding from Right) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={handleCloseModal}
            className={`
              fixed inset-0 bg-black/50 transition-opacity duration-300
              ${isClosing ? "opacity-0" : "opacity-100"}
            `}
          />

          {/* Right Sliding Drawer Panel */}
          <div
            onAnimationEnd={handleAnimationEnd}
            className={`
              fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-surface shadow-2xl border-l border-border flex flex-col z-50
              ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-600 shrink-0">
                  <ListTodo size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-text-primary truncate">
                    {editingTodo ? "Edit Todo Task" : "Create Todo Task"}
                  </h3>
                  <p className="text-xs text-text-secondary truncate">
                    {editingTodo ? "Update task details" : "Schedule a personal task by date"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition cursor-pointer shrink-0 ml-2"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTodo} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call lead Rahul regarding application status"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="
                      w-full rounded-lg border border-border bg-background p-2.5
                      text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                    "
                    required
                  />
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="
                      w-full rounded-lg border border-border bg-background p-2.5
                      text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                    "
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPriority("LOW")}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer
                        ${formPriority === "LOW"
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs"
                          : "border-border text-text-secondary hover:bg-neutral-50"
                        }
                      `}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriority("MEDIUM")}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer
                        ${formPriority === "MEDIUM"
                          ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs"
                          : "border-border text-text-secondary hover:bg-neutral-50"
                        }
                      `}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriority("HIGH")}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer
                        ${formPriority === "HIGH"
                          ? "bg-red-50 border-red-500 text-red-700 shadow-2xs"
                          : "border-border text-text-secondary hover:bg-neutral-50"
                        }
                      `}
                    >
                      High
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Add detailed task notes or action items..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="
                      w-full rounded-lg border border-border bg-background p-2.5
                      text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                    "
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formTitle.trim()}
                  className="
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-xs font-medium text-white
                    hover:bg-primary-700 transition disabled:opacity-50 cursor-pointer
                  "
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingTodo ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todo;
