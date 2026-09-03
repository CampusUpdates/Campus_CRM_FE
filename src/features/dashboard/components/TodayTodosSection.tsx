import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Loader2,
  ListTodo,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ROUTES } from "../../../app/router/routes";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  type TodoItem,
} from "../../../services/todoService";

const formatDateIso = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const TodayTodosSection = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const todayIso = formatDateIso(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Add state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [adding, setAdding] = useState(false);

  const loadTodayTodos = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchTodos(accessToken, todayIso);
      setTodos(data);
    } catch (err: any) {
      console.error("Failed to load today's todos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayTodos();
  }, [accessToken]);

  // Toggle Completion
  const handleToggleComplete = async (todo: TodoItem) => {
    if (!accessToken) return;
    const newStatus = !todo.isCompleted;

    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: newStatus } : t))
    );

    try {
      await updateTodo(accessToken, todo.id, { isCompleted: newStatus });
      toast.showToast(
        newStatus ? "Task completed" : "Task marked pending",
        "success"
      );
    } catch (err: any) {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t))
      );
      toast.showToast(err.message || "Failed to update task", "error");
    }
  };

  // Quick Add Task for Today
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newTitle.trim()) return;

    setAdding(true);
    try {
      await createTodo(accessToken, {
        title: newTitle.trim(),
        dueDate: todayIso,
        priority: newPriority,
      });

      toast.showToast("Task added for Today", "success");
      setNewTitle("");
      setShowQuickAdd(false);
      loadTodayTodos();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to add task", "error");
    } finally {
      setAdding(false);
    }
  };

  const completedCount = todos.filter((t) => t.isCompleted).length;
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
            <ListTodo size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Today's Tasks</h3>
            <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
              <Calendar size={11} className="text-primary-600" />
              {todayFormatted}
              {todos.length > 0 && ` • ${completedCount}/${todos.length} done`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="
            inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 border border-primary-200
            text-xs font-semibold hover:bg-primary-100 transition shadow-2xs
          "
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <form onSubmit={handleQuickAdd} className="mt-3 p-2.5 rounded-lg bg-neutral-50 border border-primary-200 space-y-2">
          <input
            type="text"
            placeholder="What do you need to do today?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="
              w-full rounded-lg border border-border bg-surface px-2.5 py-1.5
              text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
            autoFocus
            required
          />

          <div className="flex items-center justify-between gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="MEDIUM">Med Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-2 py-1 rounded text-xs text-text-muted hover:bg-neutral-200 transition"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition disabled:opacity-50 inline-flex items-center gap-1"
              >
                {adding && <Loader2 size={12} className="animate-spin" />} Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="mt-3 flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-text-muted">
            <RefreshCw size={16} className="animate-spin text-primary-600 mr-2" />
            <span className="text-xs">Loading today's tasks...</span>
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-neutral-50/60 rounded-xl border border-dashed border-border">
            <CheckCircle2 size={24} className="text-neutral-300 mb-1" />
            <p className="text-xs font-semibold text-text-primary">No tasks for today</p>
            <p className="text-[11px] text-text-muted mt-0.5">Click "Add" above to create one</p>
          </div>
        ) : (
          todos.map((todo) => {
            const isHigh = todo.priority === "HIGH";
            const isLow = todo.priority === "LOW";

            return (
              <div
                key={todo.id}
                className={`
                  flex items-start justify-between gap-2.5 p-2.5 rounded-lg border transition
                  ${
                    todo.isCompleted
                      ? "bg-neutral-50/80 border-border opacity-70"
                      : isHigh
                      ? "bg-red-50/20 border-red-200"
                      : "bg-surface border-border hover:border-primary-300 shadow-2xs"
                  }
                `}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className="mt-0.5 shrink-0 text-primary-600 hover:scale-110 transition"
                  >
                    {todo.isCompleted ? (
                      <CheckSquare size={16} className="text-emerald-600" />
                    ) : (
                      <Square size={16} className="text-text-muted hover:text-primary-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium leading-tight ${
                        todo.isCompleted ? "line-through text-text-muted" : "text-text-primary"
                      }`}
                    >
                      {todo.title}
                    </p>
                  </div>
                </div>

                <span
                  className={`
                    shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider
                    ${
                      isHigh
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : isLow
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }
                  `}
                >
                  {todo.priority}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link to Todo Page */}
      <div className="pt-3 mt-auto border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-text-muted">Personal Schedule</span>
        <Link
          to={ROUTES.TODO}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 transition"
        >
          View All Todos <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default TodayTodosSection;
