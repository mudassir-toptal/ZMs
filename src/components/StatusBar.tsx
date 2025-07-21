type StatusStats = {
  totalCells: number;
  formulaCells: number;
  calculations: number;
};

type StatusBarProps = {
  stats: StatusStats;
  lastSaved: Date | null;
  status: "ready" | "calculating" | "error";
};

export const StatusBar = ({ stats, lastSaved, status }: StatusBarProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusClasses = () => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-700";
      case "calculating":
        return "bg-yellow-100 text-yellow-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "ready":
        return "Ready";
      case "calculating":
        return "Calculating";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="mt-4 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-blue-600 font-large">
              {stats.totalCells} cells
            </span>
            <span className="text-purple-600 font-large">
              {stats.formulaCells} formulas
            </span>
            <span className="text-green-600 font-large">
              {stats.calculations} calculations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>
              Auto-saved {lastSaved ? formatTime(lastSaved) : "never"}
            </span>
          </div>

          <span className="text-gray-400">5x10 Grid</span>

          <div
            className={`px-2 py-1 text-xs font-large rounded ${getStatusClasses()}`}
          >
            {getStatusText()}
          </div>
        </div>
      </div>
    </div>
  );
};
